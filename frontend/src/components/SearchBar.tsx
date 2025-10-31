import { Input } from "@components/ui";
import type { ReportCategory } from "@shared-types/report";

interface SearchBarProps {
  searchKeyword: string;
  onSearchChange: (value: string) => void;
  searchCategory: ReportCategory | "all";
  onCategoryChange: (category: ReportCategory | "all") => void;
}

/**
 * SearchBar：搜索框组件（Behance 风格）
 * 搜索图标 + 输入框 + 类型选择按钮（内联在搜索框内）
 */
const SearchBar = ({
  searchKeyword,
  onSearchChange,
  searchCategory,
  onCategoryChange,
}: SearchBarProps) => {
  const CATEGORY_OPTIONS = [
    { value: "all" as const, label: "全部" },
    { value: "strategy" as const, label: "策略" },
    { value: "macro" as const, label: "宏观" },
    { value: "industry" as const, label: "行业" },
    { value: "stock" as const, label: "公司" },
  ];

  return (
    <div className="flex-1 max-w-4xl flex items-center gap-2 px-4 h-10 border border-border-default rounded-sm bg-white hover:border-text-secondary transition-colors">
      {/* 搜索图标 */}
      <svg
        className="w-4 h-4 text-text-tertiary flex-shrink-0"
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

      {/* 搜索输入框 */}
      <input
        type="text"
        value={searchKeyword}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="搜索研报..."
        className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
      />

      {/* 清空按钮 */}
      {searchKeyword && (
        <button
          onClick={() => onSearchChange("")}
          className="p-1 hover:bg-slate-100 rounded transition-colors flex-shrink-0"
        >
          <svg
            className="w-4 h-4 text-text-tertiary"
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
      )}

      {/* 分隔线 */}
      <div className="w-px h-6 bg-border-default mx-1"></div>

      {/* 类型选择：平铺按钮 */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {CATEGORY_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onCategoryChange(option.value)}
            className={`px-2 py-1 text-xs font-medium rounded transition-all whitespace-nowrap ${
              searchCategory === option.value
                ? "bg-brand-500 text-white"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;
