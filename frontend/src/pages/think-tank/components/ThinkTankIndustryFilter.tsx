import type { IndustryNode, IndustryPath } from "@shared-types/thinkTank";

interface IndustryFilterProps {
  hierarchy: IndustryNode[];
  selectedPath: IndustryPath;
  onPathChange: (level: keyof IndustryPath, value: string) => void;
  subOptions: string[];
  segmentOptions: string[];
}

const chipClass =
  "rounded-full border border-border-default px-4 py-1 text-sm transition hover:border-black hover:text-black";

/**
 * 行业级联筛选：一级行业 + 子行业 + 细分赛道
 */
const ThinkTankIndustryFilter = ({
  hierarchy,
  selectedPath,
  onPathChange,
  subOptions,
  segmentOptions,
}: IndustryFilterProps) => {
  const activeIndustry =
    selectedPath.industry === "全部"
      ? undefined
      : hierarchy.find((item) => item.name === selectedPath.industry);
  const activeSub =
    activeIndustry && selectedPath.subIndustry !== "全部"
      ? activeIndustry.children?.find((item) => item.name === selectedPath.subIndustry)
      : undefined;

  const renderChips = (options: string[], level: keyof IndustryPath) => (
    <div className="flex flex-wrap gap-3">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`${chipClass} ${
            selectedPath[level] === option ? "border-black bg-black text-white" : "text-text-secondary"
          }`}
          onClick={() => onPathChange(level, option)}
        >
          {option}
        </button>
      ))}
    </div>
  );

  return (
    <div className="rounded-2xl border border-border-default bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs text-text-secondary">行业级联选择</p>
          <p className="text-base font-medium">从一级行业到核心质点</p>
        </div>
        <p className="text-xs text-text-secondary">
          {activeSub?.description ||
            activeIndustry?.description ||
            "先选行业再锁定子行业，帮助你迅速定位结构性机会"}
        </p>
      </div>
      <div className="mt-4 space-y-4">
        <div>
          <p className="text-xs text-text-secondary">一级行业</p>
          {renderChips(["全部", ...hierarchy.map((item) => item.name)], "industry")}
        </div>
        <div>
          <p className="text-xs text-text-secondary">子行业</p>
          {renderChips(subOptions, "subIndustry")}
        </div>
        <div>
          <p className="text-xs text-text-secondary">细分赛道</p>
          {renderChips(segmentOptions, "segment")}
        </div>
      </div>
    </div>
  );
};

export default ThinkTankIndustryFilter;
