import { useNavigate } from "react-router-dom";

/**
 * 首页占位：提前告诉用户可访问的核心能力
 */
const HomeLanding = () => {
  const navigate = useNavigate();

  return (
    <section className="space-y-12">
      <div className="rounded-2xl border border-border-default bg-white p-10 shadow-sm">
        <p className="text-xs tracking-[0.3em] text-text-secondary">CHENXIN RESEARCH</p>
        <h1 className="mt-4 text-4xl font-medium leading-snug">
          做到「研判快一步」，<br /> 把宏观到产业的链路拉通。
        </h1>
        <p className="mt-6 max-w-2xl text-sm text-text-secondary">
          辰星投研将智库方法论与 AI 投研助手融合，提供自上而下的穿透视角。当前开放「质点智库」与
          「辰星 AI」两大模块，免费报告可从导航直接访问。
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <button
            type="button"
            className="rounded-full bg-black px-6 py-3 text-sm text-white"
            onClick={() => navigate("/think-tank")}
          >
            进入质点智库
          </button>
          <button
            type="button"
            className="rounded-full border border-border-default px-6 py-3 text-sm"
            onClick={() => navigate("/chenxin-ai")}
          >
            体验辰星 AI
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "质点智库",
            description: "多层级行业筛选 + 报告摘要，复制传统投研路线的思考深度。",
          },
          {
            title: "辰星 AI",
            description: "面向研究员的 AI 窗口，提供模式化提示与结构化输出。",
          },
          {
            title: "免费报告",
            description: "继续访问原有的研报聚合页，保持学习节奏。",
          },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border border-border-default bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold">{item.title}</p>
            <p className="mt-3 text-xs text-text-secondary">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HomeLanding;
