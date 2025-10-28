export type ReportCategory = "stock" | "industry" | "strategy" | "macro";

/**
 * 每个分类需要知道：
 * - endpoint：请求的接口路径（report/list 或 report/jg）。
 * - qType：东方财富接口中的分类编号。
 * - referer：防止被拒绝访问的来源页头。
 * - detailMode：稍后用于拼接详情页链接的策略。
 */
export interface CategoryConfig {
  endpoint: "report/list" | "report/jg";
  qType: number;
  referer: string;
  detailMode: "infoCode" | "macroPage" | "strategyPage";
}

export const CATEGORY_CONFIGS: Record<ReportCategory, CategoryConfig> = {
  stock: {
    endpoint: "report/list",
    qType: 0,
    referer: "https://data.eastmoney.com/report/stock.jshtml",
    detailMode: "infoCode",
  },
  industry: {
    endpoint: "report/list",
    qType: 1,
    referer: "https://data.eastmoney.com/report/industry.jshtml",
    detailMode: "infoCode",
  },
  strategy: {
    endpoint: "report/jg",
    qType: 2,
    referer: "https://data.eastmoney.com/report/strategy.jshtml",
    detailMode: "strategyPage",
  },
  macro: {
    endpoint: "report/jg",
    qType: 3,
    referer: "https://data.eastmoney.com/report/macro.jshtml",
    detailMode: "macroPage",
  },
};
