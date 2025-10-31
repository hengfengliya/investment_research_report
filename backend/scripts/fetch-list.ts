import axios from "axios";
import type { ReportCategory } from "./category-config.js";
import { CATEGORY_CONFIGS } from "./category-config.js";

const API_BASE = "https://reportapi.eastmoney.com/";
const DEFAULT_PAGE_SIZE = Number(process.env.SYNC_PAGE_SIZE ?? "40");

// 抓取最近多少天的数据（无数量限制）
const LOOKBACK_DAYS = Number(process.env.SYNC_LOOKBACK_DAYS ?? "2");

/**
 * 根据日期偏移量格式化日期为 yyyy-mm-dd，便于拼接查询条件。
 */
const formatDate = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

/**
 * 计算两个日期之间的天数差（向下取整）
 */
const daysDiff = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * 从数据数组中提取最早的发布日期（假设 publishDate 字段存在）
 */
const getOldestDate = (data: Record<string, unknown>[]): string | null => {
  if (!data.length) return null;
  const dates = data
    .map((item) => item.publishDate as string | undefined)
    .filter(Boolean) as string[];
  if (!dates.length) return null;
  return dates.sort()[0];
};

/**
 * 东方财富部分接口返回 JSONP，需要手动剥离回调函数后再解析 JSON。
 */
const parseJsonp = <T>(raw: string): T => {
  const trimmed = raw.trim();

  // 有时直接返回标准 JSON，此时直接解析即可。
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return JSON.parse(trimmed) as T;
  }

  const match = trimmed.match(/^[^(]+\((.*)\)\s*;?$/s);
  if (match) {
    return JSON.parse(match[1]) as T;
  }

  if (/^<!DOCTYPE/i.test(trimmed) || /^<html/i.test(trimmed)) {
    throw new Error("接口返回 HTML，可能被风控或请求头不符合要求");
  }

  throw new Error(
    `返回数据格式异常，无法解析 JSONP，样例：${trimmed.slice(0, 120)}`,
  );
};

/**
 * 组装东方财富列表接口的查询参数，兼容 report/list 与 report/jg 两种模式。
 */
const buildParams = (category: ReportCategory) => {
  const config = CATEGORY_CONFIGS[category];

  const common = {
    cb: `datatable${Math.floor(Math.random() * 1_000_000)}`,
    pageSize: DEFAULT_PAGE_SIZE,
    pageNo: 1,
    beginTime: formatDate(-LOOKBACK_DAYS),
    endTime: formatDate(0),
    fields: "",
    qType: config.qType,
  } as Record<string, unknown>;

  if (config.endpoint === "report/list") {
    // 注意：report/list 既用于 industry 也用于 stock，但两者可选参数不同。
    // - industry：支持 industry/industryCode 等筛选；
    // - stock：如需“全市场”结果，不要传 code 参数；传入 '*' 可能导致后端不返回数据。
    if (category === "industry") {
      common.industryCode = "*";
      common.industry = "*";
      common.rating = "";
      common.ratingChange = "";
    }
    // 对于 stock，不附加 code/industry 参数，以免被当作精确筛选而返回空集
  }

  return common;
};

const http = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  // 关闭压缩，避免部分环境下 br/gzip 解压偶发 zlib 错误
  headers: { "Accept-Encoding": "identity" },
});

// 简易重试封装：处理网络抖动或被限流导致的瞬时错误
const withRetry = async <R>(fn: () => Promise<R>, attempts = 3, baseDelay = 400): Promise<R> => {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      const sleep = baseDelay * Math.pow(2, i) + Math.floor(Math.random() * 120);
      await new Promise((r) => setTimeout(r, sleep));
    }
  }
  throw last;
};

/**
 * 拉取指定分类的研报列表数据，支持自动翻页直到时间范围外。
 */
export const fetchCategoryList = async <T extends Record<string, unknown>>(
  category: ReportCategory,
) => {
  const config = CATEGORY_CONFIGS[category];
  const startDate = formatDate(-LOOKBACK_DAYS);

  // 累积所有页面的数据
  const allResults: T[] = [];
  let pageNo = 1;
  let shouldContinue = true;

  while (shouldContinue) {
    const params = buildParams(category);
    params.pageNo = pageNo;

    const response = await withRetry(() => http.get<string>(config.endpoint, {
      params,
      headers: {
        Referer: config.referer,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
      responseType: "text",
    }));

    type ApiResponse = { data: T[]; hits: number };
    const parsed = parseJsonp<ApiResponse>(response.data);
    const currentPageData = parsed.data ?? [];

    if (!currentPageData.length) {
      // 没有数据了，停止翻页
      shouldContinue = false;
      break;
    }

    allResults.push(...currentPageData);

    // 检查这一页的最早日期是否已经超出时间范围
    const oldestDate = getOldestDate(currentPageData);
    if (oldestDate && oldestDate < startDate) {
      // 已经翻到时间范围外，停止翻页
      shouldContinue = false;
      break;
    }

    pageNo += 1;
  }

  return allResults;
};
