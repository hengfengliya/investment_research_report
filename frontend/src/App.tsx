import { useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { Input } from "@components/ui";
import ReportListPage from "@pages/ReportList";
import ReportDetailPage from "@pages/ReportDetail";
import SidebarFilter from "@components/SidebarFilter";
import type { ReportFilter, ReportCategory } from "@shared-types/report";

/**
 * App 根组件：1:1 还原 Behance 布局
 *
 * 三层结构：
 * 第一行：顶部导航栏（Logo + 首页 + 个人区域）
 * 第二行：搜索 + 筛选区（筛选按钮 + 搜索框 + 类型筛选）
 * 第三行：内容区（侧边栏筛选 + 卡片网格）
 */
const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchCategory, setSearchCategory] = useState<ReportCategory | "all">("all");
  const [appliedFilters, setAppliedFilters] = useState<ReportFilter>({
    page: 1,
    pageSize: 20,
    category: "all",
    sort: "date",
  });

  const handleSidebarFilterChange = (filters: ReportFilter) => {
    setAppliedFilters(filters);
  };

  const CATEGORY_OPTIONS = [
    { value: "all" as const, label: "全部" },
    { value: "strategy" as const, label: "策略" },
    { value: "macro" as const, label: "宏观" },
    { value: "industry" as const, label: "行业" },
    { value: "stock" as const, label: "公司" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      {/* ========== 第一行：顶部导航栏 ========== */}
      <header className="sticky top-0 z-50 bg-white border-b border-border-default">
        <div className="px-8 h-16 flex items-center justify-between">
          {/* 左侧：Logo + 导航 */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <NavLink
              to="/"
              className="text-2xl font-bold text-text-primary hover:text-brand-500 transition-colors"
            >
              有物投研
            </NavLink>

            {/* 导航链接 */}
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `text-sm transition-colors ${
                  isActive
                    ? "text-text-primary font-medium"
                    : "text-text-tertiary hover:text-text-secondary"
                }`
              }
            >
              首页
            </NavLink>
          </div>

          {/* 右侧：个人区域（仅留占位） */}
          <div className="w-8"></div>
        </div>
      </header>

      {/* ========== 第二行：搜索 + 筛选区 ========== */}
      <div className="sticky top-16 z-40 bg-white border-b border-border-default">
        <div className="px-8 py-4 flex items-center gap-4">
          {/* 筛选按钮（汉堡菜单） */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`flex-shrink-0 p-2 rounded transition-all ${
              sidebarOpen
                ? "bg-brand-100 text-brand-600"
                : "hover:bg-brand-50 text-text-secondary"
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

          {/* 搜索框 */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索研报..."
                clearable={!!searchKeyword}
                onClear={() => setSearchKeyword("")}
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

          {/* 类型筛选：平铺按钮 */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {CATEGORY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSearchCategory(option.value)}
                className={`px-3 py-2 text-xs font-medium rounded transition-all ${
                  searchCategory === option.value
                    ? "bg-brand-500 text-white"
                    : "bg-transparent border border-border-default text-text-secondary hover:border-brand-500 hover:text-brand-600"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========== 第三行：内容区（侧边栏 + 卡片网格） ========== */}
      <div className="flex flex-1 overflow-hidden">
        {/* 侧边栏筛选：默认隐藏 */}
        <SidebarFilter
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onFilterChange={handleSidebarFilterChange}
        />

        {/* 主内容区 */}
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route
              path="/"
              element={
                <ReportListPage
                  searchKeyword={searchKeyword}
                  searchCategory={searchCategory}
                  appliedFilters={appliedFilters}
                  sidebarOpen={sidebarOpen}
                />
              }
            />
            <Route path="/reports/:id" element={<ReportDetailPage />} />
          </Routes>
        </main>
      </div>

      {/* 页脚 */}
      <footer className="bg-text-primary text-white py-6 text-center text-xs">
        仅供学习参考 · © {new Date().getFullYear()} 有物投研
      </footer>
    </div>
  );
};

export default App;
