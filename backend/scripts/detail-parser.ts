import axios from "axios";
import * as cheerio from "cheerio";
import type { ReportCategory } from "./category-config.js";
import { CATEGORY_CONFIGS } from "./category-config.js";

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
 * 根据 encodeUrl 生成行业/策略等详情页的完整链接。
 */
const buildEncodeUrl = (path: string, encodeUrl: string | undefined) => {
  if (!encodeUrl) {
    return null;
  }

  return `https://data.eastmoney.com/report/${path}?encodeUrl=${encodeURIComponent(encodeUrl)}`;
};

/**
 * 根据分类与列表记录推断详情页地址。
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
 * 将星级评分转换为预估影响等级，方便前端展示。
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
 * 从详情页脚本中提取 zwinfo JSON，用于读取摘要、附件等信息。
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
 * 抓取并解析研报详情，返回摘要、PDF、标签等核心信息。
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

  const doFetch = () => axios.get<string>(url, {
    timeout: 30000,
    headers: {
      Referer: CATEGORY_CONFIGS[category].referer,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      "Accept-Encoding": "identity",
    },
    responseType: "text",
  });
  let response: { data: string };
  try {
    response = await doFetch();
  } catch (e) {
    // 简单重试两次，缓解偶发网络/压缩错误
    await new Promise((r) => setTimeout(r, 500));
    try {
      response = await doFetch();
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
      response = await doFetch();
    }
  }

  const html = response.data;
  const $ = cheerio.load(html);
  const keywords = $('meta[name="keywords"]').attr("content") ?? "";
  const topicTags = keywords
    .split(/[,，\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);

  const zwinfo = extractZwinfo(html);

  const summarySource = (zwinfo?.notice_content as string | undefined) ?? "";
  // 抓取完整的摘要内容，去除多余空白符
  let summary = summarySource.replace(/\s+/g, " ").trim();
  
  // 摘要兜底逻辑：当 notice_content 缺失时，从 meta 或正文提取
  if (!summary) {
    const metaDesc = $('meta[name="description"]').attr('content') ?? '';
    summary = metaDesc.replace(/\s+/g, ' ').trim();
  }
  if (!summary) {
    const paragraphs = $('#zw_body p, .report-content p, .article-content p, .content p')
      .map((_, el) => $(el).text().replace(/\s+/g, ' ').trim())
      .get()
      .filter(Boolean)
      .slice(0, 2);
    summary = paragraphs.join(' ').trim();
  }

  const pdfUrlRaw = (zwinfo?.attach_url as string | undefined) ?? null;
  const pdfUrl = pdfUrlRaw ? pdfUrlRaw.split("?")[0] : null;

  const rawImpact = (zwinfo?.star ?? zwinfo?.rating ?? null) as
    | string
    | number
    | null
    | undefined;
  const impactLevel = mapImpactLevel(rawImpact);

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
