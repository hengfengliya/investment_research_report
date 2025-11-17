/**
 * 质点智库 Hero：强调品牌价值与方法论
 */
const ThinkTankHero = () => {
  return (
    <div className="rounded-2xl border border-border-default bg-white p-10 shadow-sm">
      <p className="text-xs tracking-[0.3em] text-text-secondary">PARTICLE THINK TANK</p>
      <h2 className="mt-4 text-3xl font-medium">
        让行业研判重回结构化：<br /> 从宏观、产业、公司快速推演。
      </h2>
      <p className="mt-4 max-w-3xl text-sm text-text-secondary">
        质点智库将传统投研的「三层拆解」具象为交互化页面：级联行业导航、全文搜索与精选报告摘要。每个数据点都源自手工整理的报告资产，并以暗金色作为极少量强调色。
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {[
          { label: "精选报告", value: "8", note: "持续扩充" },
          { label: "覆盖行业", value: "6", note: "能源 / 医药 / 工业..." },
          { label: "平均评分", value: "4.8", note: "由研究团队评估" },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-border-default p-4 text-sm">
            <p className="text-text-secondary">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{item.value}</p>
            <p className="mt-1 text-xs text-text-secondary">{item.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThinkTankHero;
