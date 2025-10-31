import { useEffect, useRef, useState } from "react";
import { Input } from "@components/ui";
import ReportCard from "@components/ReportCard";
import Pagination from "@components/Pagination";
import CategorySummary from "@components/CategorySummary";
import { SkeletonLoader, EmptyState, ErrorState } from "@components/StateComponents";
import { getCategoryStats, getReports } from "@lib/api";
import type { CategoryStat, ReportFilter, ReportListResponse, ReportCategory } from "@shared-types/report";

const DEFAULT_FILTERS: ReportFilter = {
  page: 1,
  pageSize: 20,
  category: "all",
  sort: "date",
};

/**
 * ReportListPage：研报列表页面（Behance 启发的设计）
 * - 顶部标签切换（全部、行业、公司、策略、宏观）
 * - 长搜索框（关键词搜索）
 * - 结果统计行
 * - 网格或列表展示
 */
const ReportListPage = () => {
  const [filters, setFilters] = useState<ReportFilter>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<ReportFilter>(DEFAULT_FILTERS);
  const [listData, setListData] = useState<ReportListResponse | null>(null);
  const [stats, setStats] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 标签选项
  const categoryTabs = [
    { value: "all" as const, label: "全部" },
    { value: "industry" as const, label: "行业" },
    { value: "stock" as const, label: "公司" },
    { value: "strategy" as const, label: "策略" },
    { value: "macro" as const, label: "宏观" },
  ];

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

  // 关键词输入 300ms 防抖
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

  const handleCategoryChange = (category: ReportCategory | "all") => {
    setFilters((prev) => ({ ...prev, category }));
    setAppliedFilters((prev) => ({ ...prev, category, page: 1 }));
  };

  const handleKeywordChange = (keyword: string) => {
    setFilters((prev) => ({ ...prev, keyword }));
  };

  const handlePageChange = (page: number) => {
    setAppliedFilters((prev) => ({ ...prev, page }));
    // 切换页码后平滑滚动到顶部
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasData = (listData?.items?.length ?? 0) > 0;
  const totalResults = listData?.total ?? 0;
  const currentKeyword = appliedFilters.keyword ?? "";

  return (
    <div className="w-full flex flex-col">
      {/* 顶部标签切换区 */}
      <div className="sticky top-16 z-20 bg-bg-secondary border-b border-border-default">
        <div className="px-6 py-4 space-y-4">
          {/* 标签组 */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {categoryTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleCategoryChange(tab.value)}
                className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-full transition-all ${
                  appliedFilters.category === tab.value
                    ? "bg-text-primary text-bg-secondary"
                    : "bg-transparent border border-border-default text-text-secondary hover:border-text-secondary hover:text-text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 长搜索框 */}
          <div className="max-w-2xl">
            <Input
              value={filters.keyword ?? ""}
              onChange={(e) => handleKeywordChange(e.target.value)}
              placeholder="搜索研报标题、摘要、关键词..."
              clearable={!!filters.keyword}
              onClear={() => handleKeywordChange("")}
              prefixIcon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              }
            />
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="px-6 py-8 flex-1">
        {/* 分类统计卡片（仅在全部分类时显示） */}
        {appliedFilters.category === "all" && stats.length > 0 && !loading && !error && (
          <div className="mb-8">
            <CategorySummary stats={stats} />
          </div>
        )}

        {/* 结果统计行 */}
        {hasData || (loading && listData?.total) ? (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-text-secondary">
              <span className="font-semibold text-text-primary">
                {totalResults.toLocaleString()}+
              </span>
              {" "}个结果{currentKeyword && ` 关于 "${currentKeyword}"`}
            </p>
            <div className="text-xs text-text-tertiary">
              第 {appliedFilters.page} 页，共 {listData?.totalPages ?? 0} 页
            </div>
          </div>
        ) : null}

        {/* 加载状态：显示骨架屏 */}
        {loading && (
          <div className="space-y-4">
            <SkeletonLoader count={6} />
          </div>
        )}

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

        {/* 数据展示：研报网格列表 */}
        {hasData && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listData?.items.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                highlightKeyword={currentKeyword}
                variant="grid"
              />
            ))}
          </div>
        )}

        {/* 空态：无结果 */}
        {!hasData && !loading && !error && (
          <EmptyState
            title="暂无符合条件的研报"
            description={`没有找到关于"${currentKeyword || '该分类'}"的研报。请尝试调整搜索关键词或筛选条件。`}
            action={{
              label: "清除筛选",
              onClick: () => {
                setFilters(DEFAULT_FILTERS);
                setAppliedFilters(DEFAULT_FILTERS);
              },
            }}
          />
        )}

        {/* 分页组件 */}
        {listData && listData.totalPages > 1 && !loading && (
          <div className="mt-12">
            <Pagination
              page={listData.page}
              totalPages={listData.totalPages}
              onChange={handlePageChange}
              pageSize={appliedFilters.pageSize}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportListPage;
