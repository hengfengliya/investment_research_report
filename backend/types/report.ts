/**
 * ReportFilter 描述列表接口所支持的筛选条件。
 * 所有字段均为可选，用户可以按需组合过滤规则。
 */
export interface ReportFilter {
  page?: number;
  pageSize?: number;
  category?: string;
  keyword?: string;
  org?: string;
  author?: string;
  industry?: string;
  rating?: string;
  startDate?: string;
  endDate?: string;
  sort?: "date" | "hot";
}
