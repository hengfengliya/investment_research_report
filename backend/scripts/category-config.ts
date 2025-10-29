export type ReportCategory = "stock" | "industry" | "strategy" | "macro";

/**
 * �������ã�����ͳһ�������������ҳƴ�ӷ�ʽ��
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
