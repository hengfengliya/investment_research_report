import type { KeyboardEvent, MouseEvent } from "react";
import { Badge, Button } from "@components/ui";
import type { Report, ReportCategory } from "@shared-types/report";

const GRID_CATEGORY_TEXT: Record<ReportCategory, string> = {
  strategy: "策略",
  macro: "宏观",
  industry: "行业",
  stock: "公司",
};

const LIST_CATEGORY_TEXT: Record<ReportCategory, string> = {
  strategy: "策略",
  macro: "宏观",
  industry: "行业",
  stock: "个股",
};

interface ReportCardProps {
  report: Report;
  highlightKeyword?: string;
  variant?: "list" | "grid";
}

const formatDate = (value: string) => {
  const date = new Date(value); // 将 ISO 字符串转换成本地日期，方便阅读
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("zh-CN");
};

const highlight = (text: string, keyword?: string) => {
  if (!keyword) return text; // 如果没有关键词就直接返回
  const safe = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // 处理正则特殊字符
  if (!safe) return text;
  return text.split(new RegExp(`(${safe})`, "gi")).map((part, idx) =>
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
  const impactLevelText = { high: "高影响", medium: "中影响", low: "低影响" };
  const hasPdf = Boolean(report.pdfUrl);

  const openPdf = () => {
    if (!report.pdfUrl) return; // 所有交互入口最终都会调到这里
    window.open(report.pdfUrl, "_blank", "noopener,noreferrer");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!hasPdf) return; // 无 PDF 时不做处理，避免报错
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPdf();
    }
  };

  const stopAndOpen = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation(); // 防止冒泡触发整卡点击
    openPdf();
  };

  const downloadPdf = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!report.pdfUrl) return;
    const anchor = document.createElement("a");
    anchor.href = report.pdfUrl;
    anchor.target = "_blank";
    anchor.rel = "noreferrer";
    anchor.download = "";
    anchor.click();
  };

  const articleProps = {
    role: hasPdf ? ("button" as const) : undefined,
    tabIndex: hasPdf ? 0 : undefined,
    onClick: () => hasPdf && openPdf(),
    onKeyDown: handleKeyDown,
  };
  const stateClass = hasPdf ? "cursor-pointer" : "cursor-not-allowed opacity-70";

  if (variant === "grid") {
    return (
      <article
        {...articleProps}
        className={`flex h-full flex-col rounded-sm border border-border-default bg-bg-secondary shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden group ${stateClass}`}
      >
        <div className="px-4 pt-4 pb-2 flex items-center gap-2 flex-wrap">
          {report.category && <Badge variant="default" size="sm">{GRID_CATEGORY_TEXT[report.category]}</Badge>}
          {report.rating && <Badge variant="filled" size="sm">{report.rating}</Badge>}
        </div>
        <div className="px-4 py-3 flex-1 flex flex-col space-y-3">
          <h3 className="text-sm font-semibold text-text-primary line-clamp-2 leading-snug">
            {highlight(report.title, highlightKeyword)}
          </h3>
          {report.summary && <p className="text-xs text-text-secondary line-clamp-2 flex-1 leading-relaxed">{highlight(report.summary, highlightKeyword)}</p>}
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
    <article
      {...articleProps}
      className={`rounded-md border border-border-default bg-bg-secondary shadow-sm transition-all duration-fast hover:shadow-md hover:-translate-y-0.5 ${stateClass}`}
    >
      <div className="p-5 space-y-3">
        {(report.category || report.industry) && (
          <div className="flex flex-wrap gap-2">
            {report.category && <Badge variant="default" size="sm">{LIST_CATEGORY_TEXT[report.category]}</Badge>}
            {report.industry && <Badge variant="default" size="sm">{report.industry}</Badge>}
          </div>
        )}
        <h2 className="text-base font-semibold text-text-primary line-clamp-2">
          {highlight(report.title, highlightKeyword)}
        </h2>
        {(report.rating || report.stockName || report.impactLevel) && (
          <div className="flex flex-wrap gap-2">
            {report.rating && <Badge variant="filled" size="sm">评级：{report.rating}</Badge>}
            {report.stockName && <Badge variant="filled" size="sm">{report.stockName}{report.stockCode && `（${report.stockCode}）`}</Badge>}
            {typeof report.targetPrice === "number" && <Badge variant="default" size="sm">目标价：¥{report.targetPrice.toFixed(2)}</Badge>}
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
          {report.summary ? highlight(report.summary, highlightKeyword) : "暂未提取摘要，可点击打开 PDF 查看原文。"}
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
        <Button variant="primary" size="sm" onClick={stopAndOpen} disabled={!hasPdf}>
          查看 PDF
        </Button>
        <Button variant="secondary" size="sm" onClick={downloadPdf} disabled={!hasPdf}>
          下载 PDF
        </Button>
      </div>
    </article>
  );
};

export default ReportCard;
