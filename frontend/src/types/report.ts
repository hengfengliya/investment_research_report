export type ReportCategory = "strategy" | "macro" | "industry" | "stock";

/**
 * Report 瀹氫箟浜嗗墠绔睍绀烘墍闇€鐨勭爺鎶ュ瓧娈点€? */
export interface Report {
  id: number;
  title: string;
  category: ReportCategory;
  org: string | null;
  author: string | null;
  date: string;
  summary: string | null;
  pdfUrl: string | null;
  sourceUrl: string;
  stockCode: string | null;
  stockName: string | null;
  industry: string | null;
  rating: string | null;
  ratingChange: string | null;
  targetPrice: number | null;
  changePercent: number | null;
  topicTags: string[];
  impactLevel: "high" | "medium" | "low" | null;
}

export interface ReportListResponse {
  items: Report[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CategoryStat {
  category: ReportCategory;
  count: number;
}

export interface ReportFilter {
  page?: number;
  pageSize?: number;
  category?: ReportCategory | "all";
  keyword?: string;
  org?: string;
  author?: string;
  industry?: string;
  rating?: string;
  startDate?: string;
  endDate?: string;
  sort?: "date" | "hot";
}

