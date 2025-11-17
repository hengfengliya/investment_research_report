import { useState } from "react";
import { Button } from "@components/ui";
import { Input } from "@components/ui";
import type { ReportFilter, ReportCategory } from "@shared-types/report";

interface FilterBarProps {
  filters: ReportFilter;
  onChange: <K extends keyof ReportFilter>(
    key: K,
    value: ReportFilter[K],
  ) => void;
  onApply: () => void;
  onReset: () => void;
}

const CATEGORY_OPTIONS: Array<{
  value: ReportCategory | "all";
  label: string;
}> = [
  { value: "all", label: "全部类型" },
  { value: "strategy", label: "策略研报" },
  { value: "macro", label: "宏观研报" },
  { value: "industry", label: "行业研报" },
  { value: "stock", label: "个股研报" },
];

const SORT_OPTIONS: Array<{ value: NonNullable<ReportFilter["sort"]>; label: string }> = [
  { value: "date", label: "按发布时间" },
  { value: "hot", label: "按热度" },
];

/**
 * FilterBar：二层筛选区组件（金融极简白设计）
 * - 第一层（常用横排）：关键词输入（占比最大） + 研报类型 + 排序 + 操作按钮
 * - 第二层（更多筛选，折叠）：发布时间、机构、作者等高级筛选
 */
const FilterBar = ({ filters, onChange, onApply, onReset }: FilterBarProps) => {
  const [showMore, setShowMore] = useState(false);

  const handleChange = (
    key: keyof ReportFilter,
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    onChange(key, event.target.value as ReportFilter[typeof key]);
  };

  // 统计已应用的筛选条件数（不含关键词和排序）
  const appliedFilterCount = [
    filters.category !== "all",
    filters.org,
    filters.author,
    filters.startDate,
    filters.endDate,
  ].filter(Boolean).length;

  return (
    <section className="space-y-4 rounded-md bg-bg-secondary border border-border-default p-6 shadow-sm">
      {/* 第一层：常用筛选（横排） */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        {/* 关键词输入：占比最大 */}
        <div className="flex-1">
          <label htmlFor="keyword" className="mb-2 block text-sm font-medium text-text-primary">
            关键词
          </label>
          <Input
            id="keyword"
            value={filters.keyword ?? ""}
            onChange={(event) => handleChange("keyword", event)}
            placeholder="输入标题或摘要中的关键词，300ms 防抖搜索"
            clearable={!!filters.keyword}
            onClear={() => onChange("keyword", "")}
          />
        </div>

        {/* 研报类型 */}
        <div className="md:w-32">
          <label htmlFor="category" className="mb-2 block text-sm font-medium text-text-primary">
            报告类型
          </label>
          <select
            id="category"
            value={filters.category ?? "all"}
            onChange={(event) => handleChange("category", event)}
            className="w-full h-10 rounded-sm border border-border-default bg-bg-secondary px-3 text-sm text-text-primary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value as string} value={option.value ?? ""}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* 排序方式 */}
        <div className="md:w-32">
          <label htmlFor="sort" className="mb-2 block text-sm font-medium text-text-primary">
            排序方式
          </label>
          <select
            id="sort"
            value={filters.sort ?? "date"}
            onChange={(event) => handleChange("sort", event)}
            className="w-full h-10 rounded-sm border border-border-default bg-bg-secondary px-3 text-sm text-text-primary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value ?? ""} value={option.value ?? ""}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 操作按钮区 */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button variant="primary" size="md" onClick={onApply}>
          应用筛选
        </Button>
        <Button variant="secondary" size="md" onClick={onReset}>
          重置条件
        </Button>
        <button
          onClick={() => setShowMore((v) => !v)}
          className="inline-flex items-center gap-1 px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <span>
            {showMore ? "收起筛选" : "更多筛选"}
            {appliedFilterCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-50 text-xs font-medium text-brand-600">
                {appliedFilterCount}
              </span>
            )}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${showMore ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </div>

      {/* 第二层：更多筛选（可折叠） */}
      {showMore && (
        <div className="border-t border-border-default pt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* 发布机构 */}
            <div>
              <label htmlFor="org" className="mb-2 block text-sm font-medium text-text-primary">
                发布机构
              </label>
              <Input
                id="org"
                value={filters.org ?? ""}
                onChange={(event) => handleChange("org", event)}
                placeholder="如：中信证券"
                clearable={!!filters.org}
                onClear={() => onChange("org", "")}
              />
            </div>

            {/* 作者 */}
            <div>
              <label htmlFor="author" className="mb-2 block text-sm font-medium text-text-primary">
                作者
              </label>
              <Input
                id="author"
                value={filters.author ?? ""}
                onChange={(event) => handleChange("author", event)}
                placeholder="输入分析师姓名"
                clearable={!!filters.author}
                onClear={() => onChange("author", "")}
              />
            </div>

            {/* 开始日期 */}
            <div>
              <label htmlFor="startDate" className="mb-2 block text-sm font-medium text-text-primary">
                开始日期
              </label>
              <input
                id="startDate"
                type="date"
                value={filters.startDate ?? ""}
                onChange={(event) => handleChange("startDate", event)}
                className="w-full h-10 rounded-sm border border-border-default bg-bg-secondary px-3 text-sm text-text-primary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              />
            </div>

            {/* 结束日期 */}
            <div>
              <label htmlFor="endDate" className="mb-2 block text-sm font-medium text-text-primary">
                结束日期
              </label>
              <input
                id="endDate"
                type="date"
                value={filters.endDate ?? ""}
                onChange={(event) => handleChange("endDate", event)}
                className="w-full h-10 rounded-sm border border-border-default bg-bg-secondary px-3 text-sm text-text-primary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default FilterBar;

