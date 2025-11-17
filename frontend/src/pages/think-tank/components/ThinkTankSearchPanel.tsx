interface SearchPanelProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  stats: {
    total: number;
    filtered: number;
    avgRating: number;
    industries: number;
  };
}

const quickTags = ["新能源", "工业金属", "储能招标", "AI 投研"];

/**
 * 搜索与概览：提供输入框 + 数据摘要
 */
const ThinkTankSearchPanel = ({ searchTerm, onSearchChange, stats }: SearchPanelProps) => {
  return (
    <div className="rounded-2xl border border-border-default bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <label className="text-xs text-text-secondary">搜索行业 / 关键词 / 标签</label>
          <input
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="例如：油服 技术升级 / 奢侈品 渠道 / 储能 IRR"
            className="mt-2 w-full rounded-2xl border border-border-default px-4 py-3 text-sm focus:border-black focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
          {quickTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="rounded-full border border-border-default px-3 py-1 text-text-secondary transition hover:border-black hover:text-text-primary"
              onClick={() => onSearchChange(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 grid gap-4 text-sm md:grid-cols-4">
        <div>
          <p className="text-xs text-text-secondary">全部报告</p>
          <p className="mt-2 text-2xl font-semibold">{stats.total}</p>
        </div>
        <div>
          <p className="text-xs text-text-secondary">符合筛选</p>
          <p className="mt-2 text-2xl font-semibold">{stats.filtered}</p>
        </div>
        <div>
          <p className="text-xs text-text-secondary">平均评分</p>
          <p className="mt-2 text-2xl font-semibold">{stats.avgRating}</p>
        </div>
        <div>
          <p className="text-xs text-text-secondary">覆盖一级行业</p>
          <p className="mt-2 text-2xl font-semibold">{stats.industries}</p>
        </div>
      </div>
    </div>
  );
};

export default ThinkTankSearchPanel;
