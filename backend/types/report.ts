/**
 * ReportFilter 表示列表接口可以接受的过滤条件。
 * 每个字段都设置为可选（optional），这样用户只需要传自己关心的条件。
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
