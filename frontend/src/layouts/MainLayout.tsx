import { Outlet } from "react-router-dom";
import TopNav from "@components/navigation/TopNav";

/**
 * 主布局：固定顶部导航 + 居中内容区
 */
const MainLayout = () => {
  return (
    <div className="min-h-screen bg-bg-secondary text-text-primary">
      <TopNav />
      <main className="mx-auto max-w-6xl px-6 pb-16 pt-28">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
