import { NavLink, Route, Routes } from "react-router-dom";
import ReportListPage from "@pages/ReportList";
import ReportDetailPage from "@pages/ReportDetail";

const NAV_LINK_CLASS =
  "rounded px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 border-b-2 border-transparent";

const App = () => {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <NavLink to="/" className="text-lg font-semibold text-slate-900">
            有物投研
          </NavLink>
          <nav className="flex gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${NAV_LINK_CLASS} ${isActive ? "text-slate-900 border-brand-500" : ""}`
              }
            >
              首页
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<ReportListPage />} />
          <Route path="/reports/:id" element={<ReportDetailPage />} />
        </Routes>
      </main>

      <footer className="bg-slate-900 py-6 text-center text-xs text-slate-400">
        仅供学习参考 · © {new Date().getFullYear()} 有物投研
      </footer>
    </div>
  );
};

export default App;
