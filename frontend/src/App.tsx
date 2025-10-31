import { useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { Input } from "@components/ui";
import ReportListPage from "@pages/ReportList";
import ReportDetailPage from "@pages/ReportDetail";
import SidebarFilter from "@components/SidebarFilter";
import type { ReportFilter, ReportCategory } from "@shared-types/report";

/**
 * App 根组件：完全按照 Behance 布局实现
 * 顶部导航：Logo（左）+ 首页（左）+ 筛选按钮（左）+ 搜索框（中，含类型筛选）
 * 左侧筛选：点击筛选按钮展开，显示分类、排序、每页条数
 * 布局自适应：筛选打开时卡片缩小，关闭时卡片扩大
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

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 顶部导航栏：Behance 风格 */}
      <header className="sticky top-0 z-40 bg-white border-b border-border-default">
        <div className="px-6 h-16 flex items-center justify-between gap-4">
          {/* 左侧：Logo + 首页 + 筛选按钮 */}
          <div className="flex items-center gap-6 min-w-fit">
            {/* Logo */}
            <NavLink
              to="/"
              className="text-xl font-bold text-text-primary hover:opacity-70 transition-opacity"
            >
              有物投研
            </NavLink>

            {/* 首页导航 */}
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `text-sm transition-colors ${
                  isActive
                    ? "text-text-primary font-medium border-b-2 border-text-primary pb-1"
                    : "text-text-secondary hover:text-text-primary border-b-2 border-transparent pb-1"
                }`
              }
            >
              首页
            </NavLink>

            {/* 筛选按钮 */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded transition-colors ${
                sidebarOpen
                  ? "bg-brand-50 text-brand-600"
                  : "hover:bg-brand-50 text-text-secondary hover:text-brand-600"
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
          </div>

          {/* 中间：搜索框 + 类型筛选 */}
          <div className="flex-1 max-w-3xl">
            <div className="flex items-center gap-2">
              {/* 搜索框 */}
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

              {/* 类型快速筛选 */}
              <select
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value as ReportCategory | "all")}
                className="px-3 h-10 text-sm border border-border-default rounded bg-white text-text-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">全部类型</option>
                <option value="strategy">策略</option>
                <option value="macro">宏观</option>
                <option value="industry">行业</option>
                <option value="stock">公司</option>
              </select>
            </div>
          </div>

          {/* 右侧：空（预留） */}
          <div className="w-16"></div>
        </div>
      </header>

      {/* 主内容区：左侧筛选 + 右侧列表 */}
      <div className="flex flex-1">
        {/* 侧边栏筛选 - 点击后展开，卡片自动缩小 */}
        <SidebarFilter
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onFilterChange={handleSidebarFilterChange}
        />

        {/* 主内容 - 响应式宽度 */}
        <main className="flex-1 overflow-hidden">
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
      <footer className="bg-slate-900 py-6 text-center text-xs text-slate-400 border-t border-slate-800">
        仅供学习参考 · © {new Date().getFullYear()} 有物投研
      </footer>
    </div>
  );
};

export default App;
