#!/usr/bin/env bun

import pLimit from "p-limit";
import { prisma } from "../lib/prisma.js";
import type { ReportCategory } from "./category-config.js";
import { fetchCategoryListInRange } from "./fetch-list.js";
import { fetchDetailInfo, resolveDetailUrl } from "./detail-parser.js";

/**
 * 并发抓取详情页的并发数（建议 6-8，过高会被限流）
 */
const CONCURRENCY = Number(process.env.SYNC_CONCURRENCY ?? "8");

/**
 * 按分类顺序抓取（策略 → 宏观 → 行业 → 个股）
 */
const CATEGORY_SEQUENCE: ReportCategory[] = [
  "strategy",
  "macro",
  "industry",
  "stock",
];

interface CategorySummary {
  category: ReportCategory;
  fetched: number;
  inserted: number;
  updated: number;
  errors: number;
}

interface SyncSummary {
  dateRange: { start: string; end: string };
  totalFetched: number;
  totalInserted: number;
  totalUpdated: number;
  totalErrors: number;
  categories: CategorySummary[];
}

const limit = pLimit(CONCURRENCY);

// 辅助函数：数值转换
const toNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

// 辅助函数：作者名称规范化
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

// 辅助函数：标签去重（最多 10 个）
const deduplicateTags = (tags: string[]) => Array.from(new Set(tags)).slice(0, 10);

// 辅助函数：获取机构名称
const ensureOrgName = (record: Record<string, unknown>) => {
  const org =
    (record.orgSName as string | undefined) ??
    (record.orgName as string | undefined) ??
    "未知机构";
  return org.trim() || "未知机构";
};

/**
 * 生成中国时区（Asia/Shanghai）的当前时间（RFC3339 字符串）
 * 作用：确保"入库时间 createdAt"为中国区的年月日时分秒。
 */
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

/**
 * 规范化发布日期
 */
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

/**
 * 验证日期格式（YYYY-MM-DD）
 */
const validateDateFormat = (dateStr: string): boolean => {
  const pattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!pattern.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !Number.isNaN(date.getTime());
};

/**
 * 同步指定分类的数据
 */
const syncCategory = async (
  category: ReportCategory,
  startDate: string,
  endDate: string,
): Promise<CategorySummary> => {
  const summary: CategorySummary = {
    category,
    fetched: 0,
    inserted: 0,
    updated: 0,
    errors: 0,
  };

  try {
    console.log(`[${category}] 正在抓取 ${startDate} 至 ${endDate} 的数据...`);
    const list = await fetchCategoryListInRange<Record<string, unknown>>(
      category,
      startDate,
      endDate,
    );
    summary.fetched = list.length;

    if (list.length === 0) {
      console.log(`[${category}] 未找到数据`);
      return summary;
    }

    console.log(`[${category}] 获取 ${list.length} 条数据，开始详情抓取...`);

    // 构建唯一键列表用于批量查询
    const uniqueKeys = list.map((record) => ({
      title: String(record.title ?? "").trim(),
      date: ensureDate(record.publishDate),
      org: ensureOrgName(record),
    }));

    // 一次性从数据库查询所有已存在的记录
    const existingRecords = await prisma.report.findMany({
      where: {
        OR: uniqueKeys.map((key) => ({
          AND: [
            { title: key.title },
            { date: key.date },
            { org: key.org },
          ],
        })),
      },
      select: { id: true, title: true, date: true, org: true },
    });

    // 在内存中构建 Map，快速查找
    const existingMap = new Map(
      existingRecords.map((record) => [
        `${record.title}|${record.date.toISOString()}|${record.org}`,
        record.id,
      ]),
    );

    await Promise.all(
      list.map((record) =>
        limit(async () => {
          try {
            const detail = await fetchDetailInfo(category, record);
            const sourceUrl = resolveDetailUrl(category, record) ?? "";
            const authors = normalizeAuthors(record.author ?? record.researcher);
            const reportData = {
              title: String(record.title ?? "").trim(),
              category,
              org: ensureOrgName(record),
              author: authors.join(","),
              date: ensureDate(record.publishDate),
              summary: detail.summary,
              pdfUrl: detail.pdfUrl,
              sourceUrl,
              stockCode:
                (record.stockCode as string | undefined) ?? detail.stockCode ?? null,
              stockName:
                (record.stockName as string | undefined) ?? detail.stockName ?? null,
              industry:
                (record.industryName as string | undefined) ?? detail.industryName ?? null,
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
              summary.errors += 1;
              return;
            }

            // 在内存中查找是否已存在
            const mapKey = `${reportData.title}|${reportData.date.toISOString()}|${reportData.org}`;
            const existingId = existingMap.get(mapKey);

            if (existingId) {
              // 已存在 → 更新
              await prisma.report.update({
                where: { id: existingId },
                data: reportData,
              });
              summary.updated += 1;
            } else {
              // 不存在 → 新增
              await prisma.report.create({
                data: { ...reportData, createdAt: chinaNow() },
              });
              summary.inserted += 1;
            }
          } catch (error) {
            summary.errors += 1;
            const message = error instanceof Error ? error.message : String(error);
            console.error(`[${category}] 同步单条记录失败：${message.substring(0, 100)}`);
          }
        }),
      ),
    );

    console.log(
      `[${category}] 完成 - 新增: ${summary.inserted}, 更新: ${summary.updated}, 错误: ${summary.errors}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${category}] 抓取失败：${message}`);
    summary.errors += 1;
  }

  return summary;
};

/**
 * 执行自定义日期范围的同步
 */
export const syncCustomDateRange = async (
  startDate: string,
  endDate: string,
): Promise<SyncSummary> => {
  console.log("\n=== 开始自定义日期范围数据同步 ===");
  console.log(`日期范围: ${startDate} 至 ${endDate}\n`);

  const categories: CategorySummary[] = [];

  for (const category of CATEGORY_SEQUENCE) {
    const result = await syncCategory(category, startDate, endDate);
    categories.push(result);
  }

  await prisma.$disconnect();

  const totalFetched = categories.reduce((sum, item) => sum + item.fetched, 0);
  const totalInserted = categories.reduce((sum, item) => sum + item.inserted, 0);
  const totalUpdated = categories.reduce((sum, item) => sum + item.updated, 0);
  const totalErrors = categories.reduce((sum, item) => sum + item.errors, 0);

  return {
    dateRange: { start: startDate, end: endDate },
    totalFetched,
    totalInserted,
    totalUpdated,
    totalErrors,
    categories,
  };
};

// 脚本入口：从命令行参数读取日期范围
const isDirectRun =
  process.argv[1]?.includes("sync-custom-range.ts") ||
  process.argv[1]?.includes("sync-custom-range.js");

if (isDirectRun) {
  const startDate = process.argv[2];
  const endDate = process.argv[3];

  if (!startDate || !endDate) {
    console.error("使用方式: bun run ./scripts/sync-custom-range.ts <start-date> <end-date>");
    console.error("例如: bun run ./scripts/sync-custom-range.ts 2025-01-01 2025-01-31");
    console.error("\n日期格式: YYYY-MM-DD");
    process.exit(1);
  }

  if (!validateDateFormat(startDate) || !validateDateFormat(endDate)) {
    console.error("❌ 日期格式错误，必须为 YYYY-MM-DD");
    console.error(`收到: startDate="${startDate}", endDate="${endDate}"`);
    process.exit(1);
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start > end) {
    console.error("❌ 开始日期不能晚于结束日期");
    process.exit(1);
  }

  syncCustomDateRange(startDate, endDate)
    .then((summary) => {
      console.log("\n=== 同步完成 ===");
      console.log(JSON.stringify(summary, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ 同步失败:", error);
      process.exit(1);
    });
}
