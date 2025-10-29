import pLimit from "p-limit";
import { prisma } from "../lib/prisma";
import type { ReportCategory } from "./category-config";
import { fetchCategoryList } from "./fetch-list";
import { fetchDetailInfo, resolveDetailUrl } from "./detail-parser";
/**
 * 控制同时处理的详情抓取数量，避免压垮接口或本机带宽。
 */
const CONCURRENCY = Number(process.env.SYNC_CONCURRENCY ?? "4");
/**
 * 固定同步顺序，优先抓策略、宏观，再处理行业和个股，方便观察日志。
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
  totalFetched: number;
  totalInserted: number;
  totalUpdated: number;
  totalErrors: number;
  categories: CategorySummary[];
}
const limit = pLimit(CONCURRENCY);
const toNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};
const normalizeAuthors = (value: unknown) => {
  if (!value) return [] as string[];
  const source = Array.isArray(value) ? value : String(value).split(/[,，\s]+/);
  return source
    .map((item) => {
      const text = String(item);
      const parts = text.split(".");
      return parts.length > 1 ? parts.at(-1) ?? "" : text;
    })
    .map((name) => name.trim())
    .filter(Boolean);
};
const deduplicateTags = (tags: string[]) => Array.from(new Set(tags)).slice(0, 10);
const ensureOrgName = (record: Record<string, unknown>) => {
  const org =
    (record.orgSName as string | undefined) ??
    (record.orgName as string | undefined) ??
    "未知机构";
  return org.trim() || "未知机构";
};
const ensureDate = (value: unknown) => {
  const raw = value as string | undefined;
  if (!raw) return new Date();
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};
const syncCategory = async (category: ReportCategory): Promise<CategorySummary> => {
  const summary: CategorySummary = {
    category,
    fetched: 0,
    inserted: 0,
    updated: 0,
    errors: 0,
  };
  const list = await fetchCategoryList<Record<string, unknown>>(category);
  summary.fetched = list.length;
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
          const uniqueWhere = {
            title_date_org: {
              title: reportData.title,
              date: reportData.date,
              org: reportData.org,
            },
          };
          const existing = await prisma.report.findUnique({ where: uniqueWhere });
          if (existing) {
            await prisma.report.update({ where: { id: existing.id }, data: reportData });
            summary.updated += 1;
          } else {
            await prisma.report.create({ data: reportData });
            summary.inserted += 1;
          }
        } catch (error) {
          summary.errors += 1;
          const message = error instanceof Error ? error.message : String(error);
          console.error(`同步 ${category} 研报失败：${message}`);
        }
      }),
    ),
  );
  return summary;
};
export const runSyncOnce = async (): Promise<SyncSummary> => {
  const categories: CategorySummary[] = [];
  for (const category of CATEGORY_SEQUENCE) {
    const result = await syncCategory(category);
    categories.push(result);
  }
  await prisma.$disconnect();
  const totalFetched = categories.reduce((sum, item) => sum + item.fetched, 0);
  const totalInserted = categories.reduce((sum, item) => sum + item.inserted, 0);
  const totalUpdated = categories.reduce((sum, item) => sum + item.updated, 0);
  const totalErrors = categories.reduce((sum, item) => sum + item.errors, 0);
  return {
    totalFetched,
    totalInserted,
    totalUpdated,
    totalErrors,
    categories,
  };
};
const isDirectRun =
  process.argv[1]?.includes("sync-runner.ts") ||
  process.argv[1]?.includes("sync-runner.js");
if (isDirectRun) {
  runSyncOnce()
    .then((summary) => {
      console.log("同步完成", JSON.stringify(summary, null, 2));
    })
    .catch((error) => {
      console.error("同步任务失败", error);
      process.exit(1);
    });
}
