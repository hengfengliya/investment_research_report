import type { CategoryStat } from "@shared-types/report";

interface CategorySummaryProps {
  stats: CategoryStat[];
}

const CATEGORY_LABELS: Record<CategoryStat["category"], string> = {
  strategy: "策略研报",
  macro: "宏观研报",
  industry: "行业研报",
  stock: "个股研报",
};

/**
 * CategorySummary：分类统计卡片（金融极简白设计）
 * 展示各类研报数量，帮助用户观察数据分布
 */
const CategorySummary = ({ stats }: CategorySummaryProps) => {
  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((item) => (
        <div
          key={item.category}
          className="rounded-md border border-border-default bg-bg-secondary p-5 shadow-sm hover:shadow-md transition-all"
        >
          <p className="text-sm text-text-secondary">{CATEGORY_LABELS[item.category]}</p>
          <p className="mt-3 text-3xl font-bold text-brand-500">
            {item.count.toLocaleString()}
          </p>
          <p className="mt-2 text-xs text-text-tertiary">份研报</p>
        </div>
      ))}
    </section>
  );
};

export default CategorySummary;
