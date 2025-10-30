import { useState } from "react";
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
 * FilterBar：筛选表单组件
 * - 第一层（常用）：关键词/类型/排序 + 操作按钮
 * - 第二层（更多筛选，可折叠）：机构/作者/开始-结束日期
 */
const FilterBar = ({ filters, onChange, onApply, onReset }: FilterBarProps) => {
  const [showMore, setShowMore] = useState(false);

  const handleChange = (
    key: keyof ReportFilter,
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    onChange(key, event.target.value as ReportFilter[typeof key]);
  };

  return (
    <section className="rounded-lg bg-white p-4 shadow">
      {/* 第一层：常用筛选（横排） */}
      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-500">研报类型</span>
          <select
            value={filters.category ?? "all"}
            onChange={(event) => handleChange("category", event)}
            className="rounded border border-slate-200 p-2"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value as string} value={option.value ?? ""}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm md:col-span-1">
          <span className="text-slate-500">关键词</span>
          <input
            value={filters.keyword ?? ""}
            onChange={(event) => handleChange("keyword", event)}
            placeholder="输入标题或摘要中的关键词"
            className="rounded border border-slate-200 p-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-500">排序方式</span>
          <select
            value={filters.sort ?? "date"}
            onChange={(event) => handleChange("sort", event)}
            className="rounded border border-slate-200 p-2"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value ?? ""} value={option.value ?? ""}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* 操作按钮区 */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={onApply}
          className="rounded bg-brand-500 px-4 py-2 text-white hover:bg-brand-600"
        >
          应用筛选
        </button>
        <button
          onClick={onReset}
          className="rounded border border-slate-300 px-4 py-2 text-slate-600 hover:bg-slate-100"
        >
          重置条件
        </button>
        <button
          onClick={() => setShowMore((v) => !v)}
          className="rounded px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          {showMore ? "收起更多筛选" : "更多筛选"}
        </button>
      </div>

      {/* 第二层：更多筛选（可折叠） */}
      {showMore && (
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-500">发布机构</span>
            <input
              value={filters.org ?? ""}
              onChange={(event) => handleChange("org", event)}
              placeholder="如：中信证券"
              className="rounded border border-slate-200 p-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-500">作者</span>
            <input
              value={filters.author ?? ""}
              onChange={(event) => handleChange("author", event)}
              placeholder="输入分析师姓名"
              className="rounded border border-slate-200 p-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-500">开始日期</span>
            <input
              type="date"
              value={filters.startDate ?? ""}
              onChange={(event) => handleChange("startDate", event)}
              className="rounded border border-slate-200 p-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-500">结束日期</span>
            <input
              type="date"
              value={filters.endDate ?? ""}
              onChange={(event) => handleChange("endDate", event)}
              className="rounded border border-slate-200 p-2"
            />
          </label>
        </div>
      )}
    </section>
  );
};

export default FilterBar;

