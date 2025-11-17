import type { ReportCategory } from "@shared-types/report";

interface SearchBarProps {
  searchKeyword: string;
  onSearchChange: (value: string) => void;
  searchCategory: ReportCategory | "all";
  onCategoryChange: (category: ReportCategory | "all") => void;
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

/**
 * SearchBar：搜索框组件（Behance 风格）
 * 完全统一的搜索区域：筛选图标 + 搜索图标 + 输入框 + 类型选择按钮
 * 没有明显的分割，整体紧凑、流畅
 */
const SearchBar = ({
  searchKeyword,
  onSearchChange,
  searchCategory,
  onCategoryChange,
  sidebarOpen,
  onSidebarToggle,
}: SearchBarProps) => {
  const CATEGORY_OPTIONS = [
    { value: "all" as const, label: "全部" },
    { value: "strategy" as const, label: "策略" },
    { value: "macro" as const, label: "宏观" },
    { value: "industry" as const, label: "行业" },
    { value: "stock" as const, label: "公司" },
  ];

  return (
    <div className="flex items-center max-w-5xl h-10 border border-border-default rounded-sm bg-white hover:border-text-secondary transition-colors">
      {/* 筛选按钮（左侧） */}
      <button
        onClick={onSidebarToggle}
        className={`p-2 flex-shrink-0 transition-all ${
          sidebarOpen
            ? "text-brand-600"
            : "text-text-secondary hover:text-text-primary"
        }`}
        title="打开筛选"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
      </button>

      {/* 分隔线 */}
      <div className="w-px h-6 bg-border-default"></div>

      {/* 搜索图标 */}
      <svg
        className="w-4 h-4 text-text-tertiary flex-shrink-0 ml-3"
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
        className="flex-1 bg-transparent border-0 text-base text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 px-3"
      />

      {/* 清空按钮 */}
      {searchKeyword && (
        <button
          onClick={() => onSearchChange("")}
          className="p-1 hover:text-text-primary flex-shrink-0 transition-colors"
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
      <div className="w-px h-6 bg-border-default mx-2"></div>

      {/* 类型选择：平铺按钮 */}
      <div className="flex items-center gap-1.5 pr-3 flex-shrink-0">
        {CATEGORY_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onCategoryChange(option.value)}
            className={`px-3 py-1 text-sm font-medium rounded transition-all whitespace-nowrap ${
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
