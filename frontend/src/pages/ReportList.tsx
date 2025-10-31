import { useEffect, useRef, useState } from "react";
import FilterBar from "@components/FilterBar";
import ReportCard from "@components/ReportCard";
import Pagination from "@components/Pagination";
import CategorySummary from "@components/CategorySummary";
import { SkeletonLoader, EmptyState, ErrorState } from "@components/StateComponents";
import { getCategoryStats, getReports } from "@lib/api";
import type { CategoryStat, ReportFilter, ReportListResponse } from "@shared-types/report";

const DEFAULT_FILTERS: ReportFilter = {
  page: 1,
  pageSize: 10,
  category: "all",
  sort: "date",
};

/**
 * ReportListPage：研报列表页面（金融极简白设计）
 * 功能：筛选、搜索、分页、状态管理
 */
const ReportListPage = () => {
  const [filters, setFilters] = useState<ReportFilter>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<ReportFilter>(DEFAULT_FILTERS);
  const [listData, setListData] = useState<ReportListResponse | null>(null);
  const [stats, setStats] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 页面加载时，拉取各分类数量概览
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
        setError(err instanceof Error ? err.message : "加载失败，请稍后重试");
      })
      .finally(() => setLoading(false));
  }, [appliedFilters]);

  // 关键词输入 300ms 防抖：仅当 keyword 变化时自动查询，其他条件仍需点击"应用筛选"
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    const keyword = filters.keyword ?? "";
    if (keyword === (appliedFilters.keyword ?? "")) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setAppliedFilters((prev) => ({ ...prev, keyword, page: 1 }));
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [filters.keyword]);

  const handleFilterChange = <K extends keyof ReportFilter>(key: K, value: ReportFilter[K]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApply = () => {
    setAppliedFilters({
      ...filters,
      page: 1,
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
    setFilters((prev) => ({ ...prev, page }));
    setAppliedFilters((prev) => ({ ...prev, page }));
    // 切换页码后平滑滚动到顶部
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasData = (listData?.items?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">有物投研 · 研报聚合</h1>
        <p className="text-sm text-text-secondary">
          通过筛选条件快速定位策略、宏观、行业与个股研报，支持关键词搜索与下载。
        </p>
      </div>

      {/* 筛选条件区 */}
      <FilterBar
        filters={filters}
        onChange={handleFilterChange}
        onApply={handleApply}
        onReset={handleReset}
      />

      {/* 分类统计卡片 */}
      {stats.length > 0 && <CategorySummary stats={stats} />}

      {/* 加载状态：显示骨架屏 */}
      {loading && <SkeletonLoader count={3} />}

      {/* 错误状态 */}
      {error && !loading && (
        <ErrorState
          title="加载失败"
          message={error}
          action={{
            label: "重试",
            onClick: () => setAppliedFilters({ ...appliedFilters }),
          }}
        />
      )}

      {/* 数据展示：研报列表 */}
      {hasData && !loading && (
        <div className="space-y-4">
          {listData?.items.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              highlightKeyword={appliedFilters.keyword ?? ""}
            />
          ))}
        </div>
      )}

      {/* 空态：无结果 */}
      {!hasData && !loading && !error && (
        <EmptyState
          title="暂无符合条件的研报"
          description="您可以尝试调整筛选条件、更换关键词搜索，或重置条件后重新查看。"
          action={{
            label: "重置筛选",
            onClick: handleReset,
          }}
        />
      )}

      {/* 分页组件 */}
      {listData && listData.totalPages > 1 && !loading && (
        <Pagination
          page={listData.page}
          totalPages={listData.totalPages}
          onChange={handlePageChange}
          pageSize={appliedFilters.pageSize}
        />
      )}
    </div>
  );
};

export default ReportListPage;
