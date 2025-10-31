import { Link } from "react-router-dom";
import { Badge, Button } from "@components/ui";
import type { Report } from "@shared-types/report";

interface ReportCardProps {
  report: Report;
  // 高亮关键词：用于标题与摘要的命中高亮
  highlightKeyword?: string;
}

// 将 ISO 字符串转为日期（YYYY-MM-DD）
const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("zh-CN");
};

// 将文本中匹配到的关键字高亮显示（大小写不敏感）
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

/**
 * ReportCard：研报卡片组件（金融极简白设计）
 * 信息层级与排版：
 * 1) 顶部分类标签（行业/类型）
 * 2) 标题（2行，关键词高亮）
 * 3) 标签组（热门/评级/行业/个股等）
 * 4) 元信息（发布日期 · 机构 · 作者）
 * 5) 摘要片段（2行裁切，关键词高亮）
 * 6) 操作按钮（下载/查看详情/原文）
 */
const ReportCard = ({ report, highlightKeyword }: ReportCardProps) => {
  const impactLevelText = {
    high: "高",
    medium: "中",
    low: "低",
  };

  return (
    <article className="rounded-md border border-border-default bg-bg-secondary shadow-sm transition-all duration-fast hover:shadow-md hover:-translate-y-0.5">
      <div className="p-5 space-y-3">
        {/* 1) 顶部分类信息 */}
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

        {/* 2) 标题（2行，关键词高亮） */}
        <h2 className="text-base font-semibold text-text-primary line-clamp-2">
          <Link
            to={`/reports/${report.id}`}
            className="hover:text-brand-600 transition-colors"
          >
            {highlight(report.title, highlightKeyword)}
          </Link>
        </h2>

        {/* 3) 标签组（如果有额外标签） */}
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

        {/* 4) 元信息：发布日期 · 机构 · 作者 */}
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

        {/* 5) 摘要片段（2行裁切，关键词高亮） */}
        <p className="text-sm leading-relaxed text-text-secondary line-clamp-2">
          {report.summary
            ? highlight(report.summary, highlightKeyword)
            : "暂未提取摘要，可点击查看详情。"}
        </p>

        {/* 主题标签 */}
        {report.topicTags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {report.topicTags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="default" size="sm">
                {tag}
              </Badge>
            ))}
            {report.topicTags.length > 3 && (
              <span className="text-xs text-text-tertiary">
                +{report.topicTags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 底部操作区 */}
      <div className="border-t border-border-default px-5 py-3 flex flex-wrap gap-2">
        <Link to={`/reports/${report.id}`}>
          <Button variant="primary" size="sm">
            查看详情
          </Button>
        </Link>
        {report.pdfUrl && (
          <a href={report.pdfUrl} target="_blank" rel="noreferrer">
            <Button variant="secondary" size="sm">
              下载 PDF
            </Button>
          </a>
        )}
        <a href={report.sourceUrl} target="_blank" rel="noreferrer">
          <Button variant="ghost" size="sm">
            查看原文
          </Button>
        </a>
      </div>
    </article>
  );
};

export default ReportCard;
