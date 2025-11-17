import { useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import SearchBar from "@components/SearchBar";
import ReportListPage from "@pages/ReportList";
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
              className="text-base font-semibold text-text-primary hover:text-brand-500 transition-colors"
            >
              有物投研
            </NavLink>

            {/* 导航链接 */}
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `text-xs transition-colors ${
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
        <div className="px-8 py-4">
          {/* 搜索框：集成筛选图标 + 类型选择按钮 */}
          <SearchBar
            searchKeyword={searchKeyword}
            onSearchChange={setSearchKeyword}
            searchCategory={searchCategory}
            onCategoryChange={setSearchCategory}
            sidebarOpen={sidebarOpen}
            onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          />
        </div>
      </div>

      {/* ========== 第三行：内容区（侧边栏 + 卡片网格） ========== */}
      <div className="flex flex-1 overflow-hidden bg-bg-primary">
        {/* 侧边栏筛选：推开右侧内容（非覆盖） */}
        {sidebarOpen && (
          <SidebarFilter
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onFilterChange={handleSidebarFilterChange}
          />
        )}

        {/* 主内容区：平滑过渡 */}
        <main className={`flex-1 overflow-auto transition-all duration-300 ${sidebarOpen ? "" : "w-full"}`}>
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
