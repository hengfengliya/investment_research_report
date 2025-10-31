import { useEffect, useState } from "react";
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
 * SidebarFilter：左侧筛选抽屉（Behance 启发）
 * 桌面版固定显示，移动版点击"筛选"按钮展开
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

  // 当筛选变化时触发回调
  useEffect(() => {
    onFilterChange?.(filters);
  }, [filters, onFilterChange]);

  const handleFilterChange = (
    key: keyof ReportFilter,
    value: ReportFilter[typeof key]
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // 重置页码
    }));
  };

  const handleReset = () => {
    setFilters({
      page: 1,
      pageSize: 20,
      category: "all",
      sort: "date",
    });
  };

  return (
    <>
      {/* 移动端遮罩层 */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* 侧边栏抽屉 */}
      <aside
        className={`fixed inset-y-16 left-0 z-40 w-64 bg-bg-secondary border-r border-border-default overflow-y-auto transition-transform lg:relative lg:inset-auto lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 space-y-6">
          {/* 关闭按钮（仅移动版） */}
          <div className="flex items-center justify-between lg:hidden">
            <h3 className="text-lg font-semibold text-text-primary">筛选</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded transition-colors"
            >
              <svg
                className="w-6 h-6 text-text-secondary"
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

          {/* 分类筛选 */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-text-primary">报告类型</h4>
            <div className="space-y-2">
              {[
                { value: "all", label: "全部" },
                { value: "strategy", label: "策略" },
                { value: "macro", label: "宏观" },
                { value: "industry", label: "行业" },
                { value: "stock", label: "公司" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <input
                    type="radio"
                    name="category"
                    value={option.value}
                    checked={filters.category === option.value}
                    onChange={(e) =>
                      handleFilterChange("category", e.target.value as ReportCategory | "all")
                    }
                    className="w-4 h-4 text-brand-500 cursor-pointer"
                  />
                  <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 排序筛选 */}
          <div className="space-y-3 border-t border-border-default pt-6">
            <h4 className="text-sm font-semibold text-text-primary">排序方式</h4>
            <div className="space-y-2">
              {[
                { value: "date", label: "最新发布" },
                { value: "hot", label: "热度排序" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <input
                    type="radio"
                    name="sort"
                    value={option.value}
                    checked={filters.sort === option.value}
                    onChange={(e) =>
                      handleFilterChange("sort", e.target.value as "date" | "hot")
                    }
                    className="w-4 h-4 text-brand-500 cursor-pointer"
                  />
                  <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 每页条数 */}
          <div className="space-y-3 border-t border-border-default pt-6">
            <h4 className="text-sm font-semibold text-text-primary">每页显示</h4>
            <select
              value={filters.pageSize}
              onChange={(e) =>
                handleFilterChange("pageSize", parseInt(e.target.value, 10))
              }
              className="w-full h-10 px-3 text-sm border border-border-default rounded-sm bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value={10}>10 项</option>
              <option value={20}>20 项</option>
              <option value={50}>50 项</option>
            </select>
          </div>

          {/* 重置按钮 */}
          <button
            onClick={handleReset}
            className="w-full py-2 px-4 text-sm font-medium text-text-primary border border-border-default rounded-sm hover:bg-slate-50 transition-colors mt-6"
          >
            重置筛选
          </button>
        </div>
      </aside>
    </>
  );
};

export default SidebarFilter;
