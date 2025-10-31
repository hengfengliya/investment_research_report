import pLimit from "p-limit";
import { prisma } from "../lib/prisma.js";
import type { ReportCategory } from "./category-config.js";
import { fetchCategoryListInRange } from "./fetch-list.js";
import { fetchDetailInfo, resolveDetailUrl } from "./detail-parser.js";

const CONCURRENCY = Number(process.env.SYNC_CONCURRENCY ?? "6");
const limit = pLimit(CONCURRENCY);
const CATEGORY_SEQUENCE: ReportCategory[] = ["strategy", "macro", "industry", "stock"];

const ensureDate = (value: unknown) => {
  const raw = value as string | undefined;
  if (!raw) return new Date();
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0));
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date() : d;
};

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

const toNumber = (v: unknown) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const normalizeAuthors = (v: unknown) => {
  if (!v) return [] as string[];
  const src = Array.isArray(v) ? v : String(v).split(/[,\s、]+/);
  return src
    .map((x) => {
      const t = String(x);
      const parts = t.split(".");
      return parts.length > 1 ? parts.at(-1) ?? "" : t;
    })
    .map((s) => s.trim())
    .filter(Boolean);
};

const deduplicateTags = (tags: string[]) => Array.from(new Set(tags)).slice(0, 10);

const ensureOrgName = (record: Record<string, unknown>) => {
  const org = (record.orgSName as string | undefined) ?? (record.orgName as string | undefined) ?? "未知机构";
  return org.trim() || "未知机构";
};

const upsertCategoryByBatches = async (
  category: ReportCategory,
  records: Record<string, unknown>[],
  batchSize = 200,
) => {
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const keys = batch.map((r) => ({ title: String(r.title ?? "").trim(), date: ensureDate(r.publishDate), org: ensureOrgName(r) }));
    const existing = await prisma.report.findMany({
      where: { OR: keys.map((k) => ({ AND: [{ title: k.title }, { date: k.date }, { org: k.org }] })) },
      select: { id: true, title: true, date: true, org: true },
    });
    const existingMap = new Map(existing.map((r) => [`${r.title}|${r.date.toISOString()}|${r.org}`, r.id]));

    await Promise.all(
      batch.map((record) =>
        limit(async () => {
          try {
            const detail = await fetchDetailInfo(category, record);
            const sourceUrl = resolveDetailUrl(category, record) ?? "";
            const authors = normalizeAuthors((record as any).author ?? (record as any).researcher);
            const reportData = {
              title: String(record.title ?? "").trim(),
              category,
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
                ((record as any).sRatingName as string | undefined) ?? ((record as any).rating as string | undefined) ?? null,
              ratingChange: (record as any).ratingChange !== undefined ? String((record as any).ratingChange) : null,
              targetPrice: toNumber((record as any).indvAimPriceT ?? (record as any).indvAimPriceL),
              changePercent: toNumber((record as any).changePercent),
              topicTags: deduplicateTags(detail.topicTags),
              impactLevel: category === "strategy" || category === "macro" ? detail.impactLevel : null,
              dataSource: "EastMoney" as const,
            };
            if (!reportData.title) {
              errors += 1;
              return;
            }
            const mapKey = `${reportData.title}|${reportData.date.toISOString()}|${reportData.org}`;
            const existingId = existingMap.get(mapKey);
            if (existingId) {
              await prisma.report.update({ where: { id: existingId }, data: reportData });
              updated += 1;
            } else {
              await prisma.report.create({ data: { ...reportData, createdAt: chinaNow() } });
              inserted += 1;
            }
          } catch {
            errors += 1;
          }
        }),
      ),
    );
  }
  return { inserted, updated, errors };
};

export const runFullYear2025 = async () => {
  const summary: Record<ReportCategory, { fetched: number; inserted: number; updated: number; errors: number }> = {
    strategy: { fetched: 0, inserted: 0, updated: 0, errors: 0 },
    macro: { fetched: 0, inserted: 0, updated: 0, errors: 0 },
    industry: { fetched: 0, inserted: 0, updated: 0, errors: 0 },
    stock: { fetched: 0, inserted: 0, updated: 0, errors: 0 },
  };

  const months: Array<{ begin: string; end: string }> = [];
  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, "0");
    const begin = `2025-${mm}-01`;
    const endDate = new Date(Date.UTC(2025, m, 0));
    const end = `${endDate.getUTCFullYear()}-${String(endDate.getUTCMonth() + 1).padStart(2, "0")}-${String(endDate.getUTCDate()).padStart(2, "0")}`;
    months.push({ begin, end });
  }

  for (const category of CATEGORY_SEQUENCE) {
    for (const { begin, end } of months) {
      const list = await fetchCategoryListInRange<Record<string, unknown>>(category, begin, end);
      summary[category].fetched += list.length;
      const { inserted, updated, errors } = await upsertCategoryByBatches(category, list, 200);
      summary[category].inserted += inserted;
      summary[category].updated += updated;
      summary[category].errors += errors;
    }
  }

  await prisma.$disconnect();
  return summary;
};

const isDirectRun = process.argv[1]?.includes("task-2025-full-year");
if (isDirectRun) {
  runFullYear2025()
    .then((s) => {
      console.log("2025 全量同步完成", JSON.stringify(s, null, 2));
    })
    .catch((e) => {
      console.error("2025 全量同步失败", e);
      process.exit(1);
    });
}

