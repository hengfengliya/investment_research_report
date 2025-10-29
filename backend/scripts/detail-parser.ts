import axios from "axios";
import * as cheerio from "cheerio";
import type { ReportCategory } from "./category-config";
import { CATEGORY_CONFIGS } from "./category-config";

interface DetailResult {
  summary: string;
  pdfUrl: string | null;
  topicTags: string[];
  impactLevel: "high" | "medium" | "low" | null;
  stockCode?: string | null;
  stockName?: string | null;
  industryName?: string | null;
}

/**
 * 根据 encodeUrl 拼接宏观/策略详情页链接。
 */
const buildEncodeUrl = (path: string, encodeUrl: string | undefined) => {
  if (!encodeUrl) {
    return null;
  }

  return `https://data.eastmoney.com/report/${path}?encodeUrl=${encodeURIComponent(encodeUrl)}`;
};

/**
 * 根据分类与列表记录返回详情页地址。
 */
export const resolveDetailUrl = (
  category: ReportCategory,
  record: Record<string, unknown>,
) => {
  const mode = CATEGORY_CONFIGS[category].detailMode;

  if (mode === "infoCode") {
    const infoCode = record.infoCode as string | undefined;
    if (!infoCode) return null;
    return `https://data.eastmoney.com/report/info/${infoCode}.html`;
  }

  if (mode === "strategyPage") {
    return buildEncodeUrl("zw_strategy.jshtml", record.encodeUrl as string);
  }

  if (mode === "macroPage") {
    return buildEncodeUrl("zw_macresearch.jshtml", record.encodeUrl as string);
  }

  return null;
};

/**
 * 将评级星级转换为高/中/低影响。
 */
const mapImpactLevel = (starValue?: string | number | null) => {
  if (starValue === undefined || starValue === null) {
    return null;
  }

  const star = Number(starValue);

  if (Number.isNaN(star)) {
    return null;
  }

  if (star >= 4) {
    return "high";
  }

  if (star >= 2) {
    return "medium";
  }

  return "low";
};

/**
 * 抽取详情页内的 zwinfo JSON 信息。
 */
const extractZwinfo = (html: string) => {
  const match = html.match(/var\s+zwinfo\s*=\s*(\{[\s\S]*?\});/);
  if (!match) return null;

  try {
    return JSON.parse(match[1]) as Record<string, unknown>;
  } catch (error) {
    console.warn("解析 zwinfo 失败", error);
    return null;
  }
};

/**
 * 解析详情页，提取摘要、PDF 链接等信息。
 */
export const fetchDetailInfo = async (
  category: ReportCategory,
  record: Record<string, unknown>,
): Promise<DetailResult> => {
  const url = resolveDetailUrl(category, record);

  if (!url) {
    return {
      summary: "",
      pdfUrl: null,
      topicTags: [],
      impactLevel: null,
      stockCode: record.stockCode as string | null,
      stockName: record.stockName as string | null,
      industryName: record.industryName as string | null,
    };
  }

  const response = await axios.get<string>(url, {
    headers: {
      Referer: CATEGORY_CONFIGS[category].referer,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    },
    responseType: "text",
  });

  const html = response.data;
  const $ = cheerio.load(html);
  const keywords = $('meta[name="keywords"]').attr("content") ?? "";
  const topicTags = keywords
    .split(/[,，、\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);

  const zwinfo = extractZwinfo(html);

  const summarySource =
    (zwinfo?.notice_content as string | undefined) ?? "";
  const summary = summarySource
    .replace(/\s+/g, " ")
    .slice(0, 200)
    .trim();

  const pdfUrlRaw = (zwinfo?.attach_url as string | undefined) ?? null;
  const pdfUrl = pdfUrlRaw ? pdfUrlRaw.split("?")[0] : null;

  const impactLevel = mapImpactLevel(
    zwinfo?.star ?? zwinfo?.rating ?? null,
  );

  const securityList =
    (zwinfo?.security as Record<string, unknown>[]) ?? [];
  const firstSecurity = securityList[0] ?? {};

  return {
    summary,
    pdfUrl,
    topicTags,
    impactLevel,
    stockCode: (firstSecurity.stock as string | undefined) ?? null,
    stockName: (firstSecurity.short_name as string | undefined) ?? null,
    industryName:
      (
        (firstSecurity.publish_relation as { publishName?: string }[]) ??
        []
      )[0]?.publishName ??
      (record.industryName as string | null) ??
      null,
  };
};
