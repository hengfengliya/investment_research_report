import { NavLink, useNavigate } from "react-router-dom";

interface NavItem {
  label: string;
  path?: string;
  external?: string;
}

const navItems: NavItem[] = [
  { label: "首页", path: "/" },
  { label: "智库", path: "/think-tank" },
  { label: "辰星 AI", path: "/chenxin-ai" },
  { label: "免费报告", external: "https://investment-research-report.vercel.app/" },
];

/**
 * 顶部导航：负责产品 Logo、路由跳转以及右侧功能占位
 */
const TopNav = () => {
  const navigate = useNavigate();

  const handleExternal = (url: string) => {
    window.open(url, "_blank", "noopener");
  };

  return (
    <header className="fixed top-0 left-0 right-0 border-b border-border-default bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* 左侧：Logo 与主导航 */}
        <div className="flex items-center gap-8">
          <button
            type="button"
            className="text-lg font-semibold uppercase tracking-[0.2em]"
            onClick={() => navigate("/")}
          >
            辰星投研
          </button>
          <nav className="flex items-center gap-4 text-sm">
            {navItems.map((item) =>
              item.external ? (
                <button
                  key={item.label}
                  type="button"
                  className="text-text-secondary transition hover:text-text-primary"
                  onClick={() => handleExternal(item.external!)}
                >
                  {item.label}
                </button>
              ) : (
                <NavLink
                  key={item.label}
                  to={item.path!}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-1 transition ${
                      isActive ? "bg-black text-white" : "text-text-secondary hover:text-text-primary"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ),
            )}
          </nav>
        </div>

        {/* 右侧：功能占位 */}
        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <button
            type="button"
            className="rounded-full border border-border-default px-3 py-1"
            aria-label="登录入口占位"
          >
            登录
          </button>
          <button
            type="button"
            className="rounded-full border border-border-default px-3 py-1"
            aria-label="模式切换占位"
          >
            模式
          </button>
          <button
            type="button"
            className="rounded-full border border-border-default px-3 py-1"
            aria-label="语言切换占位"
          >
            语言
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
