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

interface ReportListPageProps {
  searchKeyword?: string;
  searchCategory?: ReportCategory | "all";
  appliedFilters?: ReportFilter;
  sidebarOpen?: boolean;
}

/**
 * ReportListPage：研报列表页面（1:1 Behance 风格）
 * - 第三行区域：结果统计行（10,000+ 个结果 关于 "query"）
 * - 第四行区域：卡片列表（响应式网格）
 * - 左侧筛选打开时卡片自动缩小；关闭时扩大
 */
const ReportListPage = ({
  searchKeyword = "",
  searchCategory = "all",
  appliedFilters: propsFilters,
  sidebarOpen = false,
}: ReportListPageProps) => {
  const [listData, setListData] = useState<ReportListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 使用父组件传来的 appliedFilters，否则使用默认值
  const [mergedFilters, setMergedFilters] = useState<ReportFilter>(
    propsFilters || DEFAULT_FILTERS
  );

  // 监听来自父组件的筛选变化
  useEffect(() => {
    if (propsFilters) {
      setMergedFilters(propsFilters);
    }
  }, [propsFilters]);

  // 监听搜索关键词和搜索类型，合并更新筛选
  useEffect(() => {
    setMergedFilters((prev) => ({
      ...prev,
      keyword: searchKeyword || undefined,
      category: searchCategory,
      page: 1,
    }));
  }, [searchKeyword, searchCategory]);

  // 当筛选条件变化时，请求列表数据
  useEffect(() => {
    setLoading(true);
    setError(null);

    getReports(mergedFilters)
      .then(setListData)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "加载失败，请稍后重试");
      })
      .finally(() => setLoading(false));
  }, [mergedFilters]);

  // 处理分页
  const handlePageChange = (page: number) => {
    setMergedFilters((prev) => ({ ...prev, page }));
    // 切换页码后平滑滚动到顶部
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasData = (listData?.items?.length ?? 0) > 0;
  const totalResults = listData?.total ?? 0;
  const currentKeyword = searchKeyword ?? "";

  // 根据筛选状态动态调整网格列数
  // 筛选打开时：减少列数（卡片缩小）; 筛选关闭时：增加列数（卡片扩大）
  const gridColsClass = sidebarOpen
    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";

  // 获取完整的类型名称
  const getCategoryFullName = (category: ReportCategory | "all") => {
    const categoryMap = {
      all: "全部研报",
      strategy: "策略研究",
      macro: "宏观研究",
      industry: "行业研究",
      stock: "公司研究",
    };
    return categoryMap[category];
  };

  return (
    <div className="w-full flex flex-col bg-bg-primary min-h-screen">
      {/* 结果统计行 */}
      {hasData || (loading && listData?.total) ? (
        <div className="px-8 pt-8 pb-4">
          <h2 className="text-lg font-semibold text-text-primary">
            <span className="text-brand-500">{totalResults.toLocaleString()}+</span>
            <span className="text-text-secondary font-normal">
              {" "}个{getCategoryFullName(searchCategory)}
              {currentKeyword && ` 关于 "${currentKeyword}"`}
            </span>
          </h2>
        </div>
      ) : null}

      {/* 主内容区 */}
      <div className="px-8 pb-8 flex-1">
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
              onClick: () => setMergedFilters({ ...mergedFilters }),
            }}
          />
        )}

        {/* 卡片网格：响应式布局 */}
        {hasData && !loading && (
          <div className={`grid ${gridColsClass} gap-6 transition-all duration-300`}>
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
                setMergedFilters(DEFAULT_FILTERS);
              },
            }}
          />
        )}

        {/* 分页组件 */}
        {listData && listData.totalPages > 1 && !loading && (
          <div className="mt-12 flex justify-center">
            <Pagination
              page={listData.page}
              totalPages={listData.totalPages}
              onChange={handlePageChange}
              pageSize={mergedFilters.pageSize}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportListPage;
