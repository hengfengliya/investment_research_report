import { useState } from "react";
import { industryHierarchy } from "@data/thinkTankHierarchy";
import { useThinkTankFilters } from "@lib/useThinkTankFilters";
import type { ThinkTankReport } from "@shared-types/thinkTank";
import ThinkTankHero from "./components/ThinkTankHero";
import ThinkTankSearchPanel from "./components/ThinkTankSearchPanel";
import ThinkTankIndustryFilter from "./components/ThinkTankIndustryFilter";
import ThinkTankReportGrid from "./components/ThinkTankReportGrid";
import ThinkTankReportModal from "./components/ThinkTankReportModal";

/**
 * 质点智库页面：承载 Hero、搜索、行业级联和报告列表
 */
const ThinkTankPage = () => {
  const {
    searchTerm,
    setSearchTerm,
    selectedPath,
    updatePath,
    filteredReports,
    stats,
    availableSubIndustries,
    availableSegments,
  } = useThinkTankFilters();

  const [activeReport, setActiveReport] = useState<ThinkTankReport | null>(null);

  return (
    <section className="space-y-8">
      <ThinkTankHero />
      <ThinkTankSearchPanel searchTerm={searchTerm} onSearchChange={setSearchTerm} stats={stats} />
      <ThinkTankIndustryFilter
        hierarchy={industryHierarchy}
        selectedPath={selectedPath}
        onPathChange={updatePath}
        subOptions={availableSubIndustries}
        segmentOptions={availableSegments}
      />
      <ThinkTankReportGrid reports={filteredReports} onSelect={setActiveReport} />
      <ThinkTankReportModal report={activeReport} onClose={() => setActiveReport(null)} />
    </section>
  );
};

export default ThinkTankPage;
