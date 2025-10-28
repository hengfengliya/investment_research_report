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
 * CategorySummary 以卡片形式展示各类研报数量，帮助用户观察数据分布。
 */
const CategorySummary = ({ stats }: CategorySummaryProps) => {
  return (
    <section className="grid gap-3 md:grid-cols-4">
      {stats.map((item) => (
        <div
          key={item.category}
          className="rounded border border-slate-200 bg-white p-4 text-sm shadow-sm"
        >
          <p className="text-slate-500">{CATEGORY_LABELS[item.category]}</p>
          <p className="mt-2 text-2xl font-semibold text-brand-primary">
            {item.count.toLocaleString()}
          </p>
        </div>
      ))}
    </section>
  );
};

export default CategorySummary;
