import { NavLink, Route, Routes } from "react-router-dom";
import ReportListPage from "@pages/ReportList";
import ReportDetailPage from "@pages/ReportDetail";

/**
 * App 根组件：使用金融极简白设计风格
 * - 导航栏：白底 + 分隔线，当前路由用下方细线标识
 * - 页面背景：#FAFAFA 浅灰
 * - 页脚：深灰背景 + 轻文本
 */
const App = () => {
  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      {/* 导航栏：白底 + 分隔线 */}
      <header className="sticky top-0 z-40 bg-bg-secondary border-b border-border-default">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 h-16">
          {/* 品牌 Logo */}
          <NavLink
            to="/"
            className="text-base font-semibold text-text-primary hover:text-brand-600 transition-colors"
          >
            有物投研
          </NavLink>

          {/* 导航菜单 */}
          <nav className="flex gap-8">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `relative py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-text-primary"
                    : "text-text-secondary hover:text-text-primary"
                } ${
                  isActive
                    ? "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-500"
                    : ""
                }`
              }
            >
              首页
            </NavLink>
          </nav>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<ReportListPage />} />
          <Route path="/reports/:id" element={<ReportDetailPage />} />
        </Routes>
      </main>

      {/* 页脚 */}
      <footer className="bg-slate-900 py-6 text-center text-xs text-text-tertiary">
        仅供学习参考 · © {new Date().getFullYear()} 有物投研
      </footer>
    </div>
  );
};

export default App;
