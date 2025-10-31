import { useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import ReportListPage from "@pages/ReportList";
import ReportDetailPage from "@pages/ReportDetail";
import SidebarFilter from "@components/SidebarFilter";

/**
 * App 根组件：Behance 启发的设计风格
 * - 顶部导航：Logo + 标签切换 + 搜索框
 * - 左侧抽屉：筛选条件（点击"筛选"按钮展开）
 * - 主内容区：研报网格列表
 * - 全屏布局，充分利用空间
 */
const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      {/* 顶部导航栏：全宽，背景白色 */}
      <header className="sticky top-0 z-40 bg-bg-secondary border-b border-border-default shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between h-16">
          {/* 左侧：Logo + 筛选按钮 */}
          <div className="flex items-center gap-4">
            <NavLink
              to="/"
              className="text-lg font-bold text-text-primary hover:text-brand-600 transition-colors min-w-fit"
            >
              有物投研
            </NavLink>

            {/* 筛选按钮（仅在非详情页显示） */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-primary border border-border-default rounded-sm hover:bg-slate-50 transition-colors"
            >
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
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              筛选
            </button>
          </div>

          {/* 右侧：导航链接 */}
          <nav className="hidden md:flex gap-8">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive
                    ? "text-text-primary border-b-2 border-brand-500"
                    : "text-text-secondary hover:text-text-primary border-b-2 border-transparent"
                }`
              }
            >
              首页
            </NavLink>
          </nav>
        </div>
      </header>

      {/* 主体：侧边栏 + 内容区 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧筛选抽屉（仅桌面版固定显示） */}
        <SidebarFilter open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* 主内容区 */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<ReportListPage />} />
            <Route path="/reports/:id" element={<ReportDetailPage />} />
          </Routes>
        </main>
      </div>

      {/* 页脚 */}
      <footer className="bg-slate-900 py-6 text-center text-xs text-text-tertiary border-t border-slate-800">
        仅供学习参考 · © {new Date().getFullYear()} 有物投研
      </footer>
    </div>
  );
};

export default App;
