import { useState } from "react";
import type { ReportFilter, ReportCategory } from "@shared-types/report";

interface SidebarFilterProps {
  // 是否打开抽屉
  open: boolean;
  // 关闭回调
  onClose: () => void;
  // 筛选变化回调
  onFilterChange?: (filters: ReportFilter) => void;
}

/**
 * SidebarFilter：左侧筛选抽屉（1:1 Behance 风格）
 * 默认隐藏，点击筛选按钮后展开
 * 点击维度标题后展开详细选项
 */
const SidebarFilter = ({
  open,
  onClose,
  onFilterChange,
}: SidebarFilterProps) => {
  const [filters, setFilters] = useState<ReportFilter>({
    page: 1,
    pageSize: 20,
    category: "all",
    sort: "date",
  });

  // 维度展开状态
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null);

  const handleFilterChange = (
    key: keyof ReportFilter,
    value: ReportFilter[typeof key]
  ) => {
    const newFilters = {
      ...filters,
      [key]: value,
      page: 1,
    };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleReset = () => {
    const defaultFilters: ReportFilter = {
      page: 1,
      pageSize: 20,
      category: "all" as const,
      sort: "date" as const,
    };
    setFilters(defaultFilters);
    setExpandedDimension(null);
    onFilterChange?.(defaultFilters);
  };

  const toggleDimension = (dimension: string) => {
    setExpandedDimension(expandedDimension === dimension ? null : dimension);
  };

  // 默认隐藏，点击后展开
  if (!open) {
    return null;
  }

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 侧边栏抽屉：深灰色背景，Behance 风格 */}
      <aside className="fixed inset-y-[120px] left-0 z-40 w-72 bg-slate-900 border-r border-slate-700 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* 关闭按钮 */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">筛选</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-800 rounded transition-colors"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 筛选维度 1：报告类型 */}
          <div>
            <button
              onClick={() => toggleDimension("category")}
              className="w-full flex items-center justify-between py-2 px-0 hover:opacity-80 transition-opacity group"
            >
              <span className="text-sm font-medium text-white">
                报告类型
              </span>
              <svg
                className={`w-4 h-4 text-brand-500 transition-transform ${
                  expandedDimension === "category" ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </button>

            {/* 展开详细选项 */}
            {expandedDimension === "category" && (
              <div className="pl-0 space-y-2 mt-3">
                {[
                  { value: "all", label: "全部" },
                  { value: "strategy", label: "策略" },
                  { value: "macro", label: "宏观" },
                  { value: "industry", label: "行业" },
                  { value: "stock", label: "公司" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 cursor-pointer py-2"
                  >
                    <input
                      type="radio"
                      name="category"
                      value={option.value}
                      checked={filters.category === option.value}
                      onChange={(e) =>
                        handleFilterChange(
                          "category",
                          e.target.value as ReportCategory | "all"
                        )
                      }
                      className="w-4 h-4 text-brand-500 cursor-pointer"
                    />
                    <span className="text-sm text-slate-300">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 筛选维度 2：排序方式 */}
          <div className="border-t border-slate-700 pt-4">
            <button
              onClick={() => toggleDimension("sort")}
              className="w-full flex items-center justify-between py-2 px-0 hover:opacity-80 transition-opacity"
            >
              <span className="text-sm font-medium text-white">
                排序方式
              </span>
              <svg
                className={`w-4 h-4 text-brand-500 transition-transform ${
                  expandedDimension === "sort" ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </button>

            {/* 展开详细选项 */}
            {expandedDimension === "sort" && (
              <div className="pl-0 space-y-2 mt-3">
                {[
                  { value: "date", label: "最新发布" },
                  { value: "hot", label: "热度排序" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 cursor-pointer py-2"
                  >
                    <input
                      type="radio"
                      name="sort"
                      value={option.value}
                      checked={filters.sort === option.value}
                      onChange={(e) =>
                        handleFilterChange(
                          "sort",
                          e.target.value as "date" | "hot"
                        )
                      }
                      className="w-4 h-4 text-brand-500 cursor-pointer"
                    />
                    <span className="text-sm text-slate-300">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 筛选维度 3：每页显示 */}
          <div className="border-t border-slate-700 pt-4">
            <button
              onClick={() => toggleDimension("pageSize")}
              className="w-full flex items-center justify-between py-2 px-0 hover:opacity-80 transition-opacity"
            >
              <span className="text-sm font-medium text-white">
                每页显示
              </span>
              <svg
                className={`w-4 h-4 text-brand-500 transition-transform ${
                  expandedDimension === "pageSize" ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </button>

            {/* 展开详细选项 */}
            {expandedDimension === "pageSize" && (
              <div className="pl-0 space-y-2 mt-3">
                {[10, 20, 50].map((size) => (
                  <label
                    key={size}
                    className="flex items-center gap-3 cursor-pointer py-2"
                  >
                    <input
                      type="radio"
                      name="pageSize"
                      value={size}
                      checked={filters.pageSize === size}
                      onChange={(e) =>
                        handleFilterChange("pageSize", parseInt(e.target.value, 10))
                      }
                      className="w-4 h-4 text-brand-500 cursor-pointer"
                    />
                    <span className="text-sm text-slate-300">
                      {size} 项
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 重置按钮 */}
          <button
            onClick={handleReset}
            className="w-full py-2 px-4 text-sm font-medium text-white border border-brand-500 rounded hover:bg-brand-500 transition-all mt-6"
          >
            重置筛选
          </button>
        </div>
      </aside>
    </>
  );
};

export default SidebarFilter;
