import { useEffect, useState } from "react";
import ReportCard from "@components/ReportCard";
import Pagination from "@components/Pagination";
import { SkeletonLoader, EmptyState, ErrorState } from "@components/StateComponents";
import { getReports } from "@lib/api";
import type { ReportFilter, ReportListResponse, ReportCategory } from "@shared-types/report";

const DEFAULT_FILTERS: ReportFilter = {
  page: 1,
  pageSize: 20,
  category: "all",
  sort: "date",
};

// 分类标签选项
const CATEGORY_TABS = [
  { value: "all" as const, label: "全部" },
  { value: "industry" as const, label: "行业" },
  { value: "stock" as const, label: "公司" },
  { value: "strategy" as const, label: "策略" },
  { value: "macro" as const, label: "宏观" },
];

interface ReportListPageProps {
  searchKeyword?: string;
}

/**
 * ReportListPage：研报列表页面（Behance 风格）
 * - 顶部：分类标签切换（全部、行业、公司、策略、宏观）
 * - 结果统计行：显示 "10,000+ 个结果 关于 'xxx'"
 * - 网格布局：4 列（响应式）
 * - 左侧筛选已在 App.tsx 中处理
 */
const ReportListPage = ({ searchKeyword = "" }: ReportListPageProps) => {
  const [appliedFilters, setAppliedFilters] = useState<ReportFilter>(DEFAULT_FILTERS);
  const [listData, setListData] = useState<ReportListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 监听搜索关键词从顶部导航传入，更新筛选条件
  useEffect(() => {
    if (searchKeyword !== (appliedFilters.keyword ?? "")) {
      setAppliedFilters((prev) => ({
        ...prev,
        keyword: searchKeyword || undefined,
        page: 1,
      }));
    }
  }, [searchKeyword]);

  // 当筛选条件变化时，请求列表数据
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

  // 处理分类标签切换
  const handleCategoryChange = (category: ReportCategory | "all") => {
    setAppliedFilters((prev) => ({ ...prev, category, page: 1 }));
  };

  // 处理分页
  const handlePageChange = (page: number) => {
    setAppliedFilters((prev) => ({ ...prev, page }));
    // 切换页码后平滑滚动到顶部
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasData = (listData?.items?.length ?? 0) > 0;
  const totalResults = listData?.total ?? 0;
  const currentKeyword = searchKeyword ?? "";

  return (
    <div className="w-full flex flex-col">
      {/* 分类标签区（Behance 风格） */}
      <div className="sticky top-16 z-20 bg-white border-b border-border-default">
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleCategoryChange(tab.value)}
                className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-full transition-all ${
                  appliedFilters.category === tab.value
                    ? "bg-text-primary text-white"
                    : "bg-transparent border border-border-default text-text-secondary hover:border-text-secondary hover:text-text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="px-6 py-8 flex-1">
        {/* 结果统计行 */}
        {hasData || (loading && listData?.total) ? (
          <div className="mb-6">
            <p className="text-sm text-text-secondary">
              <span className="font-semibold text-text-primary">
                {totalResults.toLocaleString()}+
              </span>
              {" "}个结果{currentKeyword && ` 关于 "${currentKeyword}"`}
            </p>
            <p className="text-xs text-text-tertiary mt-1">
              第 {appliedFilters.page} 页，共 {listData?.totalPages ?? 0} 页
            </p>
          </div>
        ) : null}

        {/* 加载状态：显示骨架屏 */}
        {loading && (
          <div className="space-y-4">
            <SkeletonLoader count={8} />
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

        {/* 网格布局：Behance 风格（4 列响应式） */}
        {hasData && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            description={`没有找到关于"${currentKeyword || "该分类"}"的研报。请尝试调整搜索关键词或筛选条件。`}
            action={{
              label: "清除筛选",
              onClick: () => {
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
