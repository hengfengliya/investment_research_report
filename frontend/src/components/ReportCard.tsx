import { Badge, Button } from "@components/ui";
import type { Report } from "@shared-types/report";
interface ReportCardProps {
  report: Report;
  // 高亮关键词：用于标题与摘要的命中高亮
  highlightKeyword?: string;
  // 显示变体：list（列表）或 grid（网格）
  variant?: "list" | "grid";
}
// 将 ISO 字符串转为可读日期
const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("zh-CN");
};
// 文本命中关键词时高亮显示
const highlight = (text: string, keyword?: string) => {
  if (!keyword) return text;
  const safe = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!safe) return text;
  const parts = text.split(new RegExp(`(${safe})`, "gi"));
  return parts.map((part, idx) =>
    part.toLowerCase() === keyword.toLowerCase() ? (
      <mark key={idx} className="bg-brand-50 text-brand-600 font-semibold no-underline">
        {part}
      </mark>
    ) : (
      <span key={idx}>{part}</span>
    ),
  );
};
const ReportCard = ({ report, highlightKeyword, variant = "list" }: ReportCardProps) => {
  const impactLevelText = {
    high: "高影响",
    medium: "中影响",
    low: "低影响",
  };
  const targetUrl = report.pdfUrl || report.sourceUrl;
  if (variant === "grid") {
    return (
      <article className="flex flex-col h-full rounded-sm border border-border-default bg-bg-secondary shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden group">
        <div className="px-4 pt-4 pb-2 flex items-center gap-2 flex-wrap">
          {report.category && (
            <Badge variant="default" size="sm">
              {report.category === "strategy" && "策略"}
              {report.category === "macro" && "宏观"}
              {report.category === "industry" && "行业"}
              {report.category === "stock" && "公司"}
            </Badge>
          )}
          {report.rating && (
            <Badge variant="filled" size="sm">
              {report.rating}
            </Badge>
          )}
        </div>
        <div className="px-4 py-3 flex-1 flex flex-col space-y-3">
          <h3 className="text-sm font-semibold text-text-primary line-clamp-2 leading-snug">
            <a
              href={targetUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-brand-500 transition-colors"
            >
              {highlight(report.title, highlightKeyword)}
            </a>
          </h3>
          {report.summary && (
            <p className="text-xs text-text-secondary line-clamp-2 flex-1 leading-relaxed">
              {highlight(report.summary, highlightKeyword)}
            </p>
          )}
          <div className="text-xs text-text-tertiary flex items-center gap-1 flex-wrap">
            <span>{formatDate(report.date)}</span>
            <span>·</span>
            <span className="line-clamp-1">{report.org ?? "未知机构"}</span>
          </div>
        </div>
      </article>
    );
  }
  return (
    <article className="rounded-md border border-border-default bg-bg-secondary shadow-sm transition-all duration-fast hover:shadow-md hover:-translate-y-0.5">
      <div className="p-5 space-y-3">
        {(report.category || report.industry) && (
          <div className="flex flex-wrap gap-2">
            {report.category && (
              <Badge variant="default" size="sm">
                {report.category === "strategy" && "策略"}
                {report.category === "macro" && "宏观"}
                {report.category === "industry" && "行业"}
                {report.category === "stock" && "个股"}
              </Badge>
            )}
            {report.industry && (
              <Badge variant="default" size="sm">
                {report.industry}
              </Badge>
            )}
          </div>
        )}
        <h2 className="text-base font-semibold text-text-primary line-clamp-2">
          <a
            href={targetUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:text-brand-600 transition-colors"
          >
            {highlight(report.title, highlightKeyword)}
          </a>
        </h2>
        {(report.rating || report.stockName || report.impactLevel) && (
          <div className="flex flex-wrap gap-2">
            {report.rating && (
              <Badge variant="filled" size="sm">
                评级：{report.rating}
              </Badge>
            )}
            {report.stockName && (
              <Badge variant="filled" size="sm">
                {report.stockName}
                {report.stockCode && `（${report.stockCode}）`}
              </Badge>
            )}
            {typeof report.targetPrice === "number" && (
              <Badge variant="default" size="sm">
                目标价：¥{report.targetPrice.toFixed(2)}
              </Badge>
            )}
            {report.impactLevel && (
              <Badge
                variant={
                  report.impactLevel === "high"
                    ? "error"
                    : report.impactLevel === "medium"
                    ? "warning"
                    : "success"
                }
                size="sm"
              >
                影响力：{impactLevelText[report.impactLevel]}
              </Badge>
            )}
          </div>
        )}
        <div className="text-xs text-text-tertiary space-y-1">
          <div className="flex flex-wrap gap-1 text-text-secondary">
            <span>{formatDate(report.date)}</span>
            <span>·</span>
            <span>{report.org ?? "未知机构"}</span>
            {report.author && (
              <>
                <span>·</span>
                <span>{report.author}</span>
              </>
            )}
          </div>
        </div>
        <p className="text-sm leading-relaxed text-text-secondary line-clamp-2">
          {report.summary
            ? highlight(report.summary, highlightKeyword)
            : "暂未提取摘要，可点击查看原文内容。"}
        </p>
        {report.topicTags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {report.topicTags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="default" size="sm">
                {tag}
              </Badge>
            ))}
            {report.topicTags.length > 3 && (
              <span className="text-xs text-text-tertiary">+{report.topicTags.length - 3}</span>
            )}
          </div>
        )}
      </div>
      <div className="border-t border-border-default px-5 py-3 flex flex-wrap gap-2">
        <a href={targetUrl} target="_blank" rel="noreferrer">
          <Button variant="primary" size="sm">
            查看 PDF
          </Button>
        </a>
        {report.pdfUrl && (
          <a href={report.pdfUrl} target="_blank" rel="noreferrer">
            <Button variant="secondary" size="sm">
              下载 PDF
            </Button>
          </a>
        )}
      </div>
    </article>
  );
};
export default ReportCard;
