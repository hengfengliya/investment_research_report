#!/usr/bin/env bun

/**
 * 重新抓取失败记录脚本
 *
 * 用法 1 - 批量处理模式（自动处理所有错误日志）:
 *   npm run sync:retry
 *   (自动扫描 error-logs 文件夹并依次处理所有错误日志文件)
 *
 * 用法 2 - 单文件模式（处理指定文件）:
 *   npm run sync:retry <error-log-file.json>
 *   例如: npm run sync:retry sync-errors-2025-01-01-to-2025-01-31-2025-11-03.json
 *
 * 功能特性:
 * 1. 每条记录设置超时(90秒)
 * 2. 将仍然失败的记录保存到新的错误日志
 * 3. 提供详细的分类统计和成功率
 * 4. 批量模式自动跳过已重试过的文件（文件名包含 -retry-）
 * 5. 支持跳过已存在记录（通过环境变量 SYNC_SKIP_EXISTING 控制，默认跳过）
 *
 * 环境变量:
 * - SYNC_CONCURRENCY: 并发数（默认 1）
 * - SYNC_SKIP_EXISTING: 是否跳过已存在记录（默认 true，设置为 "false" 将更新已存在记录）
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { resolve, dirname, basename } from "path";
import { fileURLToPath } from "url";
import pLimit from "p-limit";
import { prisma, withRetry } from "../lib/prisma.js";
import type { ReportCategory } from "./category-config.js";
import { fetchDetailInfo, resolveDetailUrl } from "./detail-parser.js";

// 自动加载 .env 文件（如果存在）
const __filename = fileURLToPath(import.meta.url);
const projectRoot = resolve(dirname(__filename), "../..");
const errorLogsDir = resolve(projectRoot, "error-logs");
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

// 并发数(建议 1-2,稳定性优先)
const CONCURRENCY = Number(process.env.SYNC_CONCURRENCY ?? "1");

// 每条记录超时时间(毫秒),比原来的 60 秒更长
const RECORD_TIMEOUT = 90000; // 90秒

/**
 * 是否跳过已存在的记录（不更新）
 * true = 跳过已存在记录，大幅提升速度（推荐）
 * false = 更新已存在记录，确保数据最新
 * 从环境变量读取，默认 true（跳过）
 */
const SKIP_EXISTING = process.env.SYNC_SKIP_EXISTING !== "false";

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

// 重试统计接口
interface RetryStats {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  byCategory: Record<string, { success: number; failed: number; skipped: number }>;
}

/**
 * 保存新的错误日志(记录仍然失败的记录)
 */
const saveNewErrorLog = (
  originalLogPath: string,
  failedRecords: ErrorRecord[],
): string | null => {
  if (failedRecords.length === 0) {
    return null;
  }

  // 确保 error-logs 文件夹存在
  if (!existsSync(errorLogsDir)) {
    mkdirSync(errorLogsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().split("T")[0];
  const originalFileName = basename(originalLogPath);
  const newFileName = originalFileName.replace(/\.json$/, `-retry-${timestamp}.json`);
  const newLogPath = resolve(errorLogsDir, newFileName);

  const content = {
    summary: {
      totalErrors: failedRecords.length,
      byCategory: failedRecords.reduce(
        (acc, err) => {
          acc[err.category] = (acc[err.category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      generatedAt: new Date().toISOString(),
      retryFrom: originalLogPath,
    },
    errors: failedRecords,
  };

  writeFileSync(newLogPath, JSON.stringify(content, null, 2));
  return newLogPath;
};

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
  console.log(`   • 生成时间: ${errorLog.summary.generatedAt}`);
  Object.entries(errorLog.summary.byCategory).forEach(([category, count]) => {
    const name = CATEGORY_NAMES[category as ReportCategory];
    console.log(`   • 【${name}】: ${count} 条`);
  });

  const errors = errorLog.errors;

  // 初始化统计
  const stats: RetryStats = {
    total: errors.length,
    success: 0,
    failed: 0,
    skipped: 0,
    byCategory: {},
  };

  // 为每个分类初始化统计
  Object.keys(errorLog.summary.byCategory).forEach((cat) => {
    stats.byCategory[cat] = { success: 0, failed: 0, skipped: 0 };
  });

  // 用于记录仍然失败的记录
  const newErrors: ErrorRecord[] = [];

  console.log(`\n⚙️  重试配置:`);
  console.log(`   • 并发数: ${CONCURRENCY}`);
  console.log(`   • 超时时间: ${RECORD_TIMEOUT / 1000}秒`);
  console.log(`   • 跳过已存在: ${SKIP_EXISTING ? "是（推荐）" : "否（将更新已存在记录）"}`);
  console.log(`\n🔄 开始重新抓取...\n`);

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

  const startTime = Date.now();

  for (const [category, categoryErrors] of Object.entries(errorsByCategory)) {
    const categoryName = CATEGORY_NAMES[category as ReportCategory];
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`【${categoryName}】共 ${categoryErrors.length} 条记录`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    await Promise.all(
      categoryErrors.map((errorRecord) =>
        limit(async () => {
          const { title, record } = errorRecord;

          if (!record) {
            console.error(`  ✗ 跳过: 缺少原始记录数据 - ${title.substring(0, 60)}`);
            stats.failed += 1;
            stats.byCategory[category].failed += 1;
            newErrors.push({
              ...errorRecord,
              error: "缺少原始记录数据,无法重试",
              timestamp: new Date().toISOString(),
            });
            return;
          }

          const recordTitle = String(record.title ?? title).substring(0, 60);

          // 如果启用跳过模式，先检查数据库中是否已存在
          if (SKIP_EXISTING) {
            try {
              const existingRecord = await withRetry(
                () =>
                  prisma.report.findFirst({
                    where: {
                      AND: [
                        { title: String(record.title ?? "").trim() },
                        { date: ensureDate(record.publishDate) },
                        { org: ensureOrgName(record) },
                      ],
                    },
                    select: { id: true },
                  }),
                2,
                500,
              );

              if (existingRecord) {
                // 记录已存在，跳过
                stats.skipped += 1;
                stats.byCategory[category].skipped += 1;
                console.log(`  ⊙ 跳过(已存在): ${recordTitle}`);
                return;
              }
            } catch (error) {
              // 检查是否存在时出错，继续尝试处理（不跳过）
              console.warn(`  ⚠ 检查记录是否存在时出错，继续处理: ${recordTitle}`);
            }
          }

          try {
            // 创建超时 Promise
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => {
                reject(new Error(`记录处理超时 (${RECORD_TIMEOUT}ms)`));
              }, RECORD_TIMEOUT);
            });

            // 主处理逻辑
            const processPromise = (async () => {
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
            })();

            // 竞速:超时或完成
            await Promise.race([processPromise, timeoutPromise]);

            // 成功
            stats.success += 1;
            stats.byCategory[category].success += 1;
            console.log(`  ✓ 成功: ${recordTitle}`);
          } catch (error) {
            // 失败
            stats.failed += 1;
            stats.byCategory[category].failed += 1;

            const message = error instanceof Error ? error.message : String(error);
            console.error(`  ✗ 失败: ${recordTitle}`);
            console.error(`    错误: ${message.substring(0, 100)}`);

            // 记录到新的错误日志
            newErrors.push({
              ...errorRecord,
              error: message,
              timestamp: new Date().toISOString(),
            });
          }
        }),
      ),
    );

    const catStats = stats.byCategory[category];
    const statusParts = [
      `成功 ${catStats.success} 条`,
      `失败 ${catStats.failed} 条`,
    ];
    if (catStats.skipped > 0) {
      statusParts.push(`跳过 ${catStats.skipped} 条`);
    }
    console.log(`\n【${categoryName}】完成: ${statusParts.join(", ")}\n`);
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000);

  // 总结报告
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║                     ✓ 重试完成                             ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(`\n📊 重试统计 (耗时 ${elapsed}秒):`);
  console.log(`   • 总记录数: ${stats.total} 条`);
  console.log(`   • 成功:     ${stats.success} 条 ✓`);
  console.log(`   • 失败:     ${stats.failed} 条`);
  if (stats.skipped > 0) {
    console.log(`   • 跳过:     ${stats.skipped} 条 (已存在)`);
  }
  const processedTotal = stats.success + stats.failed;
  const rate = processedTotal > 0 ? ((stats.success / processedTotal) * 100).toFixed(1) : "0.0";
  console.log(`   • 成功率:   ${rate}% (基于实际处理的 ${processedTotal} 条)`);

  console.log(`\n📋 分类统计:`);
  Object.entries(stats.byCategory).forEach(([cat, catStats]) => {
    const name = CATEGORY_NAMES[cat as ReportCategory];
    const total = catStats.success + catStats.failed;
    const catRate = total > 0 ? ((catStats.success / total) * 100).toFixed(1) : "0.0";
    const parts = [`成功: ${catStats.success}`, `失败: ${catStats.failed}`];
    if (catStats.skipped > 0) {
      parts.push(`跳过: ${catStats.skipped}`);
    }
    parts.push(`成功率: ${catRate}%`);
    console.log(`   【${name}】${parts.join(" | ")}`);
  });

  // 保存新的错误日志(仍然失败的记录)
  if (newErrors.length > 0) {
    const newLogPath = saveNewErrorLog(logFilePath, newErrors);
    if (newLogPath) {
      console.log(`\n⚠️  仍有 ${newErrors.length} 条记录失败`);
      console.log(`✓ 新错误日志已保存到: ${newLogPath}`);
    }
  } else {
    console.log(`\n🎉 所有记录都已成功重试!`);
  }

  console.log("\n");
};

/**
 * 获取所有错误日志文件
 * 排除已经是 retry 后生成的文件（避免重复处理）
 */
const getAllErrorLogFiles = (): string[] => {
  try {
    if (!existsSync(errorLogsDir)) {
      return [];
    }

    const files = readdirSync(errorLogsDir)
      .filter(f => f.startsWith("sync-errors-") && f.endsWith(".json"))
      // 排除已经是 retry 后的文件（文件名包含 -retry-）
      .filter(f => !f.includes("-retry-"))
      .map(f => resolve(errorLogsDir, f));

    return files;
  } catch (error) {
    console.error("扫描 error-logs 文件夹失败:", error);
    return [];
  }
};

// 脚本入口
const errorLogFile = process.argv[2];

// 判断是单文件模式还是批量处理模式
const isBatchMode = !errorLogFile;

/**
 * 批量处理所有错误日志文件
 */
const processBatchMode = async () => {
  const allFiles = getAllErrorLogFiles();

  if (allFiles.length === 0) {
    console.log("\n✓ error-logs 文件夹中没有待处理的错误日志文件\n");
    return;
  }

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║           🔄 批量重试模式 - 处理所有错误日志               ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(`\n📂 发现 ${allFiles.length} 个待处理的错误日志文件:\n`);

  allFiles.forEach((file, index) => {
    console.log(`   ${index + 1}. ${basename(file)}`);
  });

  console.log("\n开始依次处理...\n");

  // 依次处理每个文件
  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];
    console.log(`\n${"=".repeat(60)}`);
    console.log(`处理文件 ${i + 1}/${allFiles.length}: ${basename(file)}`);
    console.log("=".repeat(60));

    try {
      await retryFailedRecords(file);
    } catch (error) {
      console.error(`\n❌ 处理文件失败: ${basename(file)}`);
      console.error(`   错误: ${error instanceof Error ? error.message : String(error)}`);
      console.log(`\n继续处理下一个文件...\n`);
    }

    // 文件之间添加间隔
    if (i < allFiles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║                  ✓ 批量处理完成                            ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(`\n已处理 ${allFiles.length} 个错误日志文件\n`);
};

/**
 * 单文件处理模式
 */
const processSingleFile = async () => {
  // 解析文件路径：支持相对路径和绝对路径
  let resolvedPath = errorLogFile;

  // 如果不是绝对路径，尝试多个可能的位置
  if (!resolve(errorLogFile).startsWith(errorLogFile)) {
    // 优先查找 error-logs 文件夹中的文件（只提供文件名时）
    if (!errorLogFile.includes("/") && !errorLogFile.includes("\\")) {
      const errorLogPath = resolve(errorLogsDir, errorLogFile);
      if (existsSync(errorLogPath)) {
        resolvedPath = errorLogPath;
      }
    }
    // 相对于当前工作目录
    else if (existsSync(errorLogFile)) {
      resolvedPath = resolve(errorLogFile);
    }
    // 相对于 error-logs 文件夹
    else if (existsSync(resolve(errorLogsDir, errorLogFile))) {
      resolvedPath = resolve(errorLogsDir, errorLogFile);
    }
    // 相对于项目根目录
    else if (existsSync(resolve(projectRoot, errorLogFile))) {
      resolvedPath = resolve(projectRoot, errorLogFile);
    }
    // 相对于 backend 目录的上一级（项目根目录）
    else if (existsSync(resolve(dirname(__filename), "../../", errorLogFile))) {
      resolvedPath = resolve(dirname(__filename), "../../", errorLogFile);
    }
    // 都找不到，使用原始路径（让后续报错更清晰）
    else {
      console.error(`\n❌ 找不到错误日志文件: ${errorLogFile}`);
      console.error(`\n提示:`);
      console.error(`   1. 错误日志现在统一存放在 error-logs 文件夹中`);
      console.error(`   2. 直接使用文件名即可: sync-errors-2025-01-01-to-2025-01-10-2025-11-03.json`);
      console.error(`   3. 或使用相对路径: ../error-logs/文件名`);
      console.error(`   4. 或使用绝对路径\n`);
      console.error(`可用的错误日志文件:`);
      try {
        const files = readdirSync(errorLogsDir).filter(f => f.startsWith("sync-errors-"));
        if (files.length > 0) {
          files.forEach(f => console.error(`   - ${f}`));
        } else {
          console.error(`   (error-logs 文件夹中没有错误日志)`);
        }
      } catch {
        // 忽略读取错误
      }
      console.error("");
      process.exit(1);
    }
  }

  console.log(`\n📍 使用错误日志文件: ${resolvedPath}\n`);
  await retryFailedRecords(resolvedPath);
};

// 主执行逻辑
const main = async () => {
  if (isBatchMode) {
    // 批量处理模式：处理所有错误日志文件
    await processBatchMode();
  } else {
    // 单文件模式：处理指定的错误日志文件
    await processSingleFile();
  }
};

main()
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
