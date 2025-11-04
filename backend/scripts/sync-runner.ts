import pLimit from "p-limit";
import { prisma } from "../lib/prisma.js";
import type { ReportCategory } from "./category-config.js";
import { fetchCategoryList } from "./fetch-list.js";
import { fetchDetailInfo, resolveDetailUrl } from "./detail-parser.js";
/**
 * 并发抓取详情页的并发数（建议 4-6，过高会被限流）
 */
const CONCURRENCY = Number(process.env.SYNC_CONCURRENCY ?? "4");

/**
 * 是否跳过已存在的记录（不更新）
 * true = 跳过已存在记录，大幅提升速度（推荐）
 * false = 更新已存在记录，确保数据最新
 * 从环境变量读取，默认 true（跳过）
 */
const SKIP_EXISTING = process.env.SYNC_SKIP_EXISTING !== "false";
/**
 * �̶�ͬ��˳������ץ���ԡ���ۣ��ٴ�����ҵ�͸��ɣ�����۲���־��
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
  skipped: number;
  errors: number;
}
interface SyncSummary {
  totalFetched: number;
  totalInserted: number;
  totalUpdated: number;
  totalSkipped: number;
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
  const source = Array.isArray(value) ? value : String(value).split(/[,��\s]+/);
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
    "δ֪����";
  return org.trim() || "δ֪����";
};
/**
 * 生成中国时区（Asia/Shanghai）的当前时间（RFC3339 字符串）
 * 作用：确保“入库时间 createdAt”为中国区的年月日时分秒。
 */
const chinaNow = (): string => {
  const now = new Date();
  const utcEpoch = now.getTime() + now.getTimezoneOffset() * 60_000; // 换算为 UTC 时间戳（毫秒）
  const shanghai = new Date(utcEpoch + 8 * 60 * 60 * 1000); // UTC+8 北京时间
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
 * 东方财富返回的格式：YYYY-MM-DD HH:MM:SS.mmm（如 2025-10-30 00:00:00.000）
 * 需要转换为当天的 UTC 午夜（如 2025-10-30T00:00:00Z）
 * 这样可以避免时区问题，确保同一天的所有报告日期一致
 */
const ensureDate = (value: unknown) => {
  const raw = value as string | undefined;
  if (!raw) return new Date();

  // 识别 YYYY-MM-DD HH:MM:SS.mmm 格式
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    // 提取年月日，忽略时间部分
    const [, yearStr, monthStr, dayStr] = match;
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);

    // 创建当天的 UTC 午夜时间
    // 这样避免时区问题，确保 2025-10-30 总是 2025-10-30T00:00:00Z
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  }

  // 其他格式尝试直接解析
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};
const syncCategory = async (category: ReportCategory): Promise<CategorySummary> => {
  const summary: CategorySummary = {
    category,
    fetched: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };
  const list = await fetchCategoryList<Record<string, unknown>>(category);
  summary.fetched = list.length;

  // 优化2：批量查询已存在的记录（而不是逐条查询）
  // 构建唯一键列表用于批量查询
  const uniqueKeys = list.map((record) => ({
    title: String(record.title ?? "").trim(),
    date: ensureDate(record.publishDate),
    org: ensureOrgName(record),
  }));

  // 一次性从数据库查询所有已存在的记录
  // 使用 AND 逻辑，因为 Prisma 不支持复合唯一键的 findMany
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

  // 在内存中构建 Map，快速查找（O(1) 时间复杂度）
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

          // 在内存中查找是否已存在（避免额外的数据库查询）
          const mapKey = `${reportData.title}|${reportData.date.toISOString()}|${reportData.org}`;
          const existingId = existingMap.get(mapKey);

          if (existingId) {
            // 已存在
            if (SKIP_EXISTING) {
              // 跳过模式：不更新
              summary.skipped += 1;
            } else {
              // 更新模式：更新已存在记录
              await prisma.report.update({ where: { id: existingId }, data: reportData });
              summary.updated += 1;
            }
          } else {
            // 不存在 → 新增
            await prisma.report.create({ data: { ...reportData, createdAt: chinaNow() } });
            summary.inserted += 1;
          }
        } catch (error) {
          summary.errors += 1;
          const message = error instanceof Error ? error.message : String(error);
          console.error(`同步 ${category} 列表失败：${message}`);
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
  const totalSkipped = categories.reduce((sum, item) => sum + item.skipped, 0);
  const totalErrors = categories.reduce((sum, item) => sum + item.errors, 0);
  return {
    totalFetched,
    totalInserted,
    totalUpdated,
    totalSkipped,
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
      console.log("ͬ�����", JSON.stringify(summary, null, 2));
    })
    .catch((error) => {
      console.error("ͬ������ʧ��", error);
      process.exit(1);
    });
}
