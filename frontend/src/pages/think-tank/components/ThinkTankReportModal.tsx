import type { ThinkTankReport } from "@shared-types/thinkTank";

interface ReportModalProps {
  report: ThinkTankReport | null;
  onClose: () => void;
}

/**
 * 报告详情弹窗：展示摘要与操作
 */
const ThinkTankReportModal = ({ report, onClose }: ReportModalProps) => {
  if (!report) return null;

  const openFile = () => {
    window.open(report.filePath, "_blank", "noopener");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-10">
      <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl border border-border-default bg-white p-8 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-text-secondary">
              {report.industryPath.industry} · {report.industryPath.subIndustry} · {report.industryPath.segment}
            </p>
            <h3 className="mt-2 text-2xl font-semibold">{report.title}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-text-secondary hover:text-black">
            关闭
          </button>
        </div>
        <div className="mt-6 space-y-4 text-sm text-text-secondary">
          <p>{report.summary}</p>
          <div>
            <p>标签：</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {report.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-border-default px-3 py-1 text-xs">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-4 text-xs md:grid-cols-3">
            <div>
              <p className="text-text-secondary">发布日期</p>
              <p className="mt-1 text-base text-black">{report.publishDate}</p>
            </div>
            <div>
              <p className="text-text-secondary">浏览 / 下载</p>
              <p className="mt-1 text-base text-black">
                {report.metrics.viewCount} / {report.metrics.downloadCount}
              </p>
            </div>
            <div>
              <p className="text-text-secondary">评分</p>
              <p className="mt-1 text-base text-brand-600">{report.metrics.rating}</p>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          <button
            type="button"
            className="rounded-full bg-black px-5 py-3 text-sm text-white"
            onClick={openFile}
          >
            打开完整报告
          </button>
          <button
            type="button"
            className="rounded-full border border-border-default px-5 py-3 text-sm"
            onClick={onClose}
          >
            返回列表
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThinkTankReportModal;
