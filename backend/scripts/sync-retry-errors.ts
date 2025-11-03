#!/usr/bin/env bun

/**
 * 重新抓取失败记录脚本
 * 用法: npm run sync:retry <error-log-file.json>
 * 例如: npm run sync:retry sync-errors-2025-01-01-to-2025-01-31-2025-11-03.json
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import pLimit from "p-limit";
import { prisma, withRetry } from "../lib/prisma.js";
import type { ReportCategory } from "./category-config.js";
import { fetchDetailInfo, resolveDetailUrl } from "./detail-parser.js";

// 自动加载 .env 文件（如果存在）
const __filename = fileURLToPath(import.meta.url);
const projectRoot = resolve(dirname(__filename), "../..");
const envPath = resolve(projectRoot, ".env");

try {
  if (process.env.DATABASE_URL === undefined) {
    const envContent = readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        const value = valueParts.join("=");
        if (key && value) {
          const cleanKey = key.trim();
          const cleanValue = value.trim().replace(/^["']|["']$/g, "");
          if (!process.env[cleanKey]) {
            process.env[cleanKey] = cleanValue;
          }
        }
      }
    });
  }
} catch {
  // .env 文件不存在或无法读取
}

// 分类中文映射
const CATEGORY_NAMES: Record<ReportCategory, string> = {
  strategy: "策略研报",
  macro: "宏观研报",
  industry: "行业研报",
  stock: "个股研报",
};

// 并发数
const CONCURRENCY = Number(process.env.SYNC_CONCURRENCY ?? "1");
const limit = pLimit(CONCURRENCY);

// 数值转换辅助函数
const toNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

// 作者名称规范化
const normalizeAuthors = (value: unknown) => {
  if (!value) return [] as string[];
  const source = Array.isArray(value) ? value : String(value).split(/[,、\s]+/);
  return source
    .map((item) => {
      const text = String(item);
      const parts = text.split(".");
      return parts.length > 1 ? parts.at(-1) ?? "" : text;
    })
    .map((name) => name.trim())
    .filter(Boolean);
};

// 标签去重（最多 10 个）
const deduplicateTags = (tags: string[]) => Array.from(new Set(tags)).slice(0, 10);

// 获取机构名称
const ensureOrgName = (record: Record<string, unknown>) => {
  const org =
    (record.orgSName as string | undefined) ??
    (record.orgName as string | undefined) ??
    "未知机构";
  return org.trim() || "未知机构";
};

// 中国时区当前时间
const chinaNow = (): string => {
  const now = new Date();
  const utcEpoch = now.getTime() + now.getTimezoneOffset() * 60_000;
  const shanghai = new Date(utcEpoch + 8 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${shanghai.getUTCFullYear()}-` +
    `${pad(shanghai.getUTCMonth() + 1)}-` +
    `${pad(shanghai.getUTCDate())}T` +
    `${pad(shanghai.getUTCHours())}:` +
    `${pad(shanghai.getUTCMinutes())}:` +
    `${pad(shanghai.getUTCSeconds())}.000Z`
  );
};

// 规范化发布日期
const ensureDate = (value: unknown) => {
  const raw = value as string | undefined;
  if (!raw) return new Date();

  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, yearStr, monthStr, dayStr] = match;
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

interface ErrorRecord {
  timestamp: string;
  category: ReportCategory;
  index: number;
  title: string;
  error: string;
  record?: Record<string, unknown>;
}

interface ErrorLogFile {
  summary: {
    totalErrors: number;
    byCategory: Record<string, number>;
    generatedAt: string;
  };
  errors: ErrorRecord[];
}

// 重试失败记录
const retryFailedRecords = async (logFilePath: string) => {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║              🔄 重新抓取失败记录                            ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  // 读取错误日志
  const content = readFileSync(logFilePath, "utf-8");
  const errorLog: ErrorLogFile = JSON.parse(content);

  console.log(`\n📋 错误日志摘要:`);
  console.log(`   • 总失败条数: ${errorLog.summary.totalErrors} 条`);
  Object.entries(errorLog.summary.byCategory).forEach(([category, count]) => {
    const name = CATEGORY_NAMES[category as ReportCategory];
    console.log(`   • 【${name}】: ${count} 条`);
  });

  const errors = errorLog.errors;
  let retrySuccess = 0;
  let retryFailed = 0;

  console.log(`\n[1/2] 初始化重试任务...`);
  console.log(`      准备重试 ${errors.length} 条失败记录\n`);

  // 按分类分组重试
  const errorsByCategory = errors.reduce(
    (acc, err) => {
      if (!acc[err.category]) {
        acc[err.category] = [];
      }
      acc[err.category].push(err);
      return acc;
    },
    {} as Record<ReportCategory, ErrorRecord[]>,
  );

  console.log(`[2/2] 开始重试...`);
  let processedCount = 0;

  for (const [category, categoryErrors] of Object.entries(errorsByCategory)) {
    const categoryName = CATEGORY_NAMES[category as ReportCategory];
    console.log(`\n【${categoryName}】重试 ${categoryErrors.length} 条失败记录...`);

    await Promise.all(
      categoryErrors.map((errorRecord) =>
        limit(async () => {
          try {
            const record = errorRecord.record as Record<string, unknown>;
            const recordTitle = String(record.title ?? "").substring(0, 40);

            // 重新抓取详情
            const detail = await fetchDetailInfo(category as ReportCategory, record);
            const sourceUrl = resolveDetailUrl(category as ReportCategory, record) ?? "";
            const authors = normalizeAuthors(record.author ?? record.researcher);

            const reportData = {
              title: String(record.title ?? "").trim(),
              category: category as ReportCategory,
              org: ensureOrgName(record),
              author: authors.join(","),
              date: ensureDate(record.publishDate),
              summary: detail.summary,
              pdfUrl: detail.pdfUrl,
              sourceUrl,
              stockCode: (record.stockCode as string | undefined) ?? detail.stockCode ?? null,
              stockName: (record.stockName as string | undefined) ?? detail.stockName ?? null,
              industry: (record.industryName as string | undefined) ?? detail.industryName ?? null,
              rating:
                (record.sRatingName as string | undefined) ??
                (record.rating as string | undefined) ??
                null,
              ratingChange:
                record.ratingChange !== undefined ? String(record.ratingChange) : null,
              targetPrice: toNumber(record.indvAimPriceT ?? record.indvAimPriceL),
              changePercent: toNumber(record.changePercent),
              topicTags: deduplicateTags(detail.topicTags),
              impactLevel:
                category === "strategy" || category === "macro" ? detail.impactLevel : null,
              dataSource: "EastMoney" as const,
            };

            if (!reportData.title) {
              throw new Error("报告标题为空");
            }

            // 查找已存在的记录
            const mapKey = `${reportData.title}|${reportData.date.toISOString()}|${reportData.org}`;
            const existingRecord = await withRetry(
              () =>
                prisma.report.findFirst({
                  where: {
                    AND: [
                      { title: reportData.title },
                      { date: reportData.date },
                      { org: reportData.org },
                    ],
                  },
                  select: { id: true },
                }),
              2,
              500,
            );

            if (existingRecord) {
              // 更新
              await withRetry(
                () =>
                  prisma.report.update({
                    where: { id: existingRecord.id },
                    data: reportData,
                  }),
                2,
                500,
              );
            } else {
              // 创建
              await withRetry(
                () =>
                  prisma.report.create({
                    data: { ...reportData, createdAt: chinaNow() },
                  }),
                2,
                500,
              );
            }

            retrySuccess += 1;
            processedCount += 1;

            // 每处理 10 条显示一次进度
            if (processedCount % 10 === 0) {
              console.log(`      ⟳ 已处理 ${processedCount}/${errors.length} 条...`);
            }
          } catch (error) {
            retryFailed += 1;
            processedCount += 1;
            const message = error instanceof Error ? error.message : String(error);
            console.error(`      ✗ 重试失败: ${errorRecord.title.substring(0, 40)}`);
            console.error(`        错误: ${message.substring(0, 100)}`);
          }
        }),
      ),
    );
  }

  // 总结报告
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║                     ✓ 重试完成                             ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(`\n📊 重试统计:`);
  console.log(`   • 总处理条数: ${processedCount} 条`);
  console.log(`   • 成功条数:   ${retrySuccess} 条 ✓`);
  console.log(`   • 失败条数:   ${retryFailed} 条`);
  console.log(`   • 成功率:     ${((retrySuccess / processedCount) * 100).toFixed(1)}%`);
  console.log("\n");
};

// 脚本入口
const errorLogFile = process.argv[2];

if (!errorLogFile) {
  console.error("使用方式: npm run sync:retry <error-log-file.json>");
  console.error("例如: npm run sync:retry sync-errors-2025-01-01-to-2025-01-31-2025-11-03.json");
  process.exit(1);
}

retryFailedRecords(errorLogFile)
  .then(() => {
    console.log("正在关闭数据库连接...");
    // 设置 10 秒超时强制退出
    const timeoutId = setTimeout(() => {
      console.log("数据库连接关闭超时，强制退出");
      process.exit(0);
    }, 10000);

    prisma.$disconnect()
      .then(() => {
        clearTimeout(timeoutId);
        console.log("✓ 数据库连接已关闭");
        process.exit(0);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        console.error("❌ 关闭数据库连接时出错:", error);
        process.exit(0);
      });
  })
  .catch((error) => {
    console.error("❌ 重试失败:", error);
    process.exit(1);
  });
