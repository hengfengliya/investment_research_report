import type { ThinkTankReport } from "@shared-types/thinkTank";

interface ReportGridProps {
  reports: ThinkTankReport[];
  onSelect: (report: ThinkTankReport) => void;
}

/**
 * 报告卡片网格：展示摘要与指标
 */
const ThinkTankReportGrid = ({ reports, onSelect }: ReportGridProps) => {
  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-default bg-white/70 p-10 text-center text-sm text-text-secondary">
        暂无符合条件的报告，请尝试调整行业或搜索词。
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {reports.map((report) => (
        <article
          key={report.id}
          className="rounded-2xl border border-border-default bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
                <span>{report.industryPath.industry}</span>
                <span>·</span>
                <span>{report.industryPath.subIndustry}</span>
                <span>·</span>
                <span>{report.industryPath.segment}</span>
              </div>
              <h3 className="mt-2 text-xl font-semibold">{report.title}</h3>
              <p className="mt-3 text-sm text-text-secondary">{report.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {report.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border-default px-3 py-1 text-text-secondary"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="shrink-0 text-right text-xs text-text-secondary">
              <p>{report.publishDate}</p>
              <p className="mt-1">浏览 {report.metrics.viewCount}</p>
              <p className="mt-1">下载 {report.metrics.downloadCount}</p>
              <p className="mt-1 text-brand-600">评分 {report.metrics.rating}</p>
              <button
                type="button"
                onClick={() => onSelect(report)}
                className="mt-4 w-full rounded-full border border-black px-4 py-2 text-sm text-black transition hover:bg-black hover:text-white"
              >
                查看摘要
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};

export default ThinkTankReportGrid;
