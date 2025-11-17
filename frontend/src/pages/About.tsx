const AboutPage = () => {
  return (
    <article className="space-y-4 rounded bg-white p-6 shadow">
      <h1 className="text-2xl font-bold text-slate-900">关于项目</h1>
      <p className="leading-relaxed text-slate-700">
        东方财富研报聚合系统旨在帮助投资者快速浏览券商策略、宏观、行业与个股研报。
        平台每日自动抓取最新报告，提供关键词搜索、筛选以及 PDF 下载入口，降低信息搜集成本。
      </p>
      <p className="leading-relaxed text-slate-700">
        数据来源于东方财富公开页面，仅供学习与研究参考，不构成投资建议。
        如需商用，请联系东方财富获取授权。
      </p>
      <p className="leading-relaxed text-slate-700">
        当前版本为最小可行产品（MVP），后续将根据需求增加热点排行、收藏、AI 摘要等扩展能力。
      </p>
    </article>
  );
};

export default AboutPage;
