import axios from "axios";
import type { ReportCategory } from "./category-config";
import { CATEGORY_CONFIGS } from "./category-config";

const API_BASE = "https://reportapi.eastmoney.com/";
const DEFAULT_PAGE_SIZE = Number(process.env.SYNC_PAGE_SIZE ?? "40"); // 每次抓取的条数，可用环境变量覆盖。
const LOOKBACK_DAYS = Number(process.env.SYNC_LOOKBACK_DAYS ?? "30"); // 回溯天数，默认近 30 天。

/**
 * 将当前日期往前或往后偏移 offset 天，并格式化成 yyyy-mm-dd。
 */
const formatDate = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

/**
 * 东方财富接口使用 JSONP，需要先去掉函数名再解析。
 */
const parseJsonp = <T>(raw: string): T => {
  const trimmed = raw.trim();

  // 接口偶尔直接返回 JSON，这里直接解析。
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return JSON.parse(trimmed) as T;
  }

  const match = trimmed.match(/^[^(]+\((.*)\)\s*;?$/s);
  if (match) {
    return JSON.parse(match[1]) as T;
  }

  if (/^<!DOCTYPE/i.test(trimmed) || /^<html/i.test(trimmed)) {
    throw new Error("接口返回 HTML，可能被风控或请求头不足");
  }

  throw new Error(
    `返回数据格式异常，无法解析 JSONP，样本：${trimmed.slice(0, 120)}`,
  );
};

/**
 * 针对 report/list 与 report/jg 两种接口组装参数。
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
 * 抓取某一分类的列表数据，返回数组。
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
    responseType: "text", // 保持文本格式，后续自行解析 JSONP。
  });

  type ApiResponse = { data: T[]; hits: number };
  const parsed = parseJsonp<ApiResponse>(response.data);
  return parsed.data ?? [];
};
