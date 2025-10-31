import { useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { Input } from "@components/ui";
import ReportListPage from "@pages/ReportList";
import ReportDetailPage from "@pages/ReportDetail";
import SidebarFilter from "@components/SidebarFilter";

/**
 * App 根组件：完全按照 Behance 布局实现
 * 顶部导航：Logo（左）+ 首页（左）+ 筛选按钮（左）+ 搜索框（中）
 */
const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");

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
              className="p-2 hover:bg-slate-100 rounded transition-colors"
              title="打开筛选"
            >
              <svg
                className="w-5 h-5 text-text-secondary"
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

          {/* 中间：长搜索框 */}
          <div className="flex-1 max-w-2xl">
            <Input
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索研报标题、摘要、关键词..."
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

          {/* 右侧：空（预留） */}
          <div className="w-24"></div>
        </div>
      </header>

      {/* 主内容区 */}
      <div className="flex flex-1">
        {/* 侧边栏筛选 */}
        <SidebarFilter
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* 主内容 */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<ReportListPage searchKeyword={searchKeyword} />} />
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
