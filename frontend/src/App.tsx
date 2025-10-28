import { NavLink, Route, Routes } from "react-router-dom";
import ReportListPage from "@pages/ReportList";
import ReportDetailPage from "@pages/ReportDetail";
import AboutPage from "@pages/About";

const NAV_LINK_CLASS =
  "rounded px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10";

const App = () => {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-brand-secondary">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <NavLink to="/" className="text-lg font-semibold text-white">
            东方财富研报聚合
          </NavLink>
          <nav className="flex gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${NAV_LINK_CLASS} ${isActive ? "bg-white/20" : ""}`
              }
            >
              首页
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `${NAV_LINK_CLASS} ${isActive ? "bg-white/20" : ""}`
              }
            >
              关于
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<ReportListPage />} />
          <Route path="/reports/:id" element={<ReportDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>

      <footer className="bg-slate-900 py-6 text-center text-xs text-slate-400">
        数据来源东方财富，仅供学习参考 · © {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default App;
