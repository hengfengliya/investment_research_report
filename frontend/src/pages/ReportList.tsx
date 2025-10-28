import { useEffect, useMemo, useState } from "react";
import FilterBar from "@components/FilterBar";
import ReportCard from "@components/ReportCard";
import Pagination from "@components/Pagination";
import CategorySummary from "@components/CategorySummary";
import {
  getCategoryStats,
  getReports,
} from "@lib/api";
import type {
  CategoryStat,
  ReportFilter,
  ReportListResponse,
} from "@types/report";

const DEFAULT_FILTERS: ReportFilter = {
  page: 1,
  pageSize: 10,
  category: "all",
  sort: "date",
};

/**
 * ReportListPage 负责列表筛选、分页与数据请求。
 */
const ReportListPage = () => {
  const [filters, setFilters] = useState<ReportFilter>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<ReportFilter>(DEFAULT_FILTERS);
  const [listData, setListData] = useState<ReportListResponse | null>(null);
  const [stats, setStats] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 页面加载时先获取各分类数量，方便概览。
    getCategoryStats()
      .then(setStats)
      .catch(() => setStats([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    getReports(appliedFilters)
      .then(setListData)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "加载失败");
      })
      .finally(() => setLoading(false));
  }, [appliedFilters]);

  const handleFilterChange = <K extends keyof ReportFilter>(
    key: K,
    value: ReportFilter[K],
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApply = () => {
    setAppliedFilters({
      ...filters,
      page: 1, // 切换条件后重置到第一页。
    });
    setFilters((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
    setAppliedFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  const hasData = (listData?.items?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">
        东方财富研报聚合
      </h1>
      <p className="text-sm text-slate-600">
        通过筛选条件快速定位策略、宏观、行业与个股研报，支持关键词搜索与下载。
      </p>

      <FilterBar
        filters={filters}
        onChange={handleFilterChange}
        onApply={handleApply}
        onReset={handleReset}
      />

      {stats.length > 0 && <CategorySummary stats={stats} />}

      {loading && (
        <div className="rounded border border-slate-200 bg-white p-6 text-center text-slate-500">
          数据加载中，请稍候…
        </div>
      )}

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      {hasData ? (
        <div className="space-y-4">
          {listData?.items.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      ) : (
        !loading && (
          <div className="rounded border border-slate-200 bg-white p-6 text-center text-slate-500">
            暂无符合条件的研报，可以尝试调整筛选条件。
          </div>
        )
      )}

      {listData && listData.totalPages > 1 && (
        <Pagination
          page={listData.page}
          totalPages={listData.totalPages}
          onChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default ReportListPage;
