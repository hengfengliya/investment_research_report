import axios from "axios";
import type { ReportCategory } from "./category-config.js";
import { CATEGORY_CONFIGS } from "./category-config.js";

const API_BASE = "https://reportapi.eastmoney.com/";
const DEFAULT_PAGE_SIZE = Number(process.env.SYNC_PAGE_SIZE ?? "40");
const LOOKBACK_DAYS = Number(process.env.SYNC_LOOKBACK_DAYS ?? "30");

/**
 * 根据日期偏移量格式化日期为 yyyy-mm-dd，便于拼接查询条件。
 */
const formatDate = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
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
  };

  if (config.endpoint === "report/list") {
    return {
      ...common,
      industryCode: "*",
      industry: "*",
      rating: "",
      ratingChange: "",
      code: "*",
    };
  }

  return common;
};

const http = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

/**
 * 拉取指定分类的研报列表数据。
 */
export const fetchCategoryList = async <T extends Record<string, unknown>>(
  category: ReportCategory,
) => {
  const config = CATEGORY_CONFIGS[category];

  const response = await http.get<string>(config.endpoint, {
    params: buildParams(category),
    headers: {
      Referer: config.referer,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    },
    responseType: "text",
  });

  type ApiResponse = { data: T[]; hits: number };
  const parsed = parseJsonp<ApiResponse>(response.data);
  return parsed.data ?? [];
};
