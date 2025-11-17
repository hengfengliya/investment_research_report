import { useMemo, useState } from "react";
import { thinkTankReports } from "@data/thinkTankReports";
import type { IndustryPath, ThinkTankReport } from "@shared-types/thinkTank";

interface Stats {
  total: number;
  filtered: number;
  avgRating: number;
  industries: number;
}

const DEFAULT_PATH: IndustryPath = {
  industry: "全部",
  subIndustry: "全部",
  segment: "全部",
};

/**
 * 统一管理智库搜索、标签筛选与统计的 Hook
 */
export const useThinkTankFilters = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPath, setSelectedPath] = useState(DEFAULT_PATH);

  const filteredReports = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return thinkTankReports.filter((report) => {
      const matchesKeyword =
        keyword.length === 0 ||
        report.title.toLowerCase().includes(keyword) ||
        report.summary.toLowerCase().includes(keyword) ||
        report.tags.some((tag) => tag.toLowerCase().includes(keyword));

      const matchesIndustry =
        selectedPath.industry === "全部" || report.industryPath.industry === selectedPath.industry;

      const matchesSubIndustry =
        selectedPath.subIndustry === "全部" || report.industryPath.subIndustry === selectedPath.subIndustry;

      const matchesSegment =
        selectedPath.segment === "全部" || report.industryPath.segment === selectedPath.segment;

      return matchesKeyword && matchesIndustry && matchesSubIndustry && matchesSegment;
    });
  }, [searchTerm, selectedPath]);

  const stats: Stats = useMemo(() => {
    const industries = new Set(thinkTankReports.map((report) => report.industryPath.industry));
    const avgRating =
      filteredReports.reduce((sum, report) => sum + report.metrics.rating, 0) /
      (filteredReports.length || 1);

    return {
      total: thinkTankReports.length,
      filtered: filteredReports.length,
      avgRating: Number(avgRating.toFixed(1)),
      industries: industries.size,
    };
  }, [filteredReports]);

  const availableSubIndustries = useMemo(() => {
    if (selectedPath.industry === "全部") {
      return ["全部"];
    }
    const subSet = new Set<string>();
    thinkTankReports.forEach((report) => {
      if (report.industryPath.industry === selectedPath.industry) {
        subSet.add(report.industryPath.subIndustry);
      }
    });
    return ["全部", ...Array.from(subSet)];
  }, [selectedPath.industry]);

  const availableSegments = useMemo(() => {
    if (selectedPath.subIndustry === "全部") {
      return ["全部"];
    }
    const segmentSet = new Set<string>();
    thinkTankReports.forEach((report) => {
      if (
        report.industryPath.industry === selectedPath.industry &&
        report.industryPath.subIndustry === selectedPath.subIndustry
      ) {
        segmentSet.add(report.industryPath.segment);
      }
    });
    return ["全部", ...Array.from(segmentSet)];
  }, [selectedPath]);

  const updatePath = (level: keyof IndustryPath, value: string) => {
    setSelectedPath((prev) => {
      if (level === "industry") {
        return { industry: value, subIndustry: "全部", segment: "全部" };
      }
      if (level === "subIndustry") {
        return { ...prev, subIndustry: value, segment: "全部" };
      }
      return { ...prev, segment: value };
    });
  };

  return {
    searchTerm,
    setSearchTerm,
    selectedPath,
    updatePath,
    filteredReports,
    stats,
    availableSubIndustries,
    availableSegments,
  };
};
