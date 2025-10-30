import { Link } from "react-router-dom";
import type { Report } from "@shared-types/report";

interface ReportCardProps {
  report: Report;
  // 高亮关键词：用于标题与摘要的命中高亮
  highlightKeyword?: string;
}

const IMPACT_COLOR: Record<NonNullable<Report["impactLevel"]>, string> = {
  high: "bg-red-100 text-red-600",
  medium: "bg-amber-100 text-amber-600",
  low: "bg-emerald-100 text-emerald-600",
};

// 将 ISO 字符串转为日期（YYYY/MM/DD）
const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("zh-CN");
};

// 将文本中匹配到的关键字高亮显示（大小写不敏感，简单直观）
const highlight = (text: string, keyword?: string) => {
  if (!keyword) return text;
  const safe = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!safe) return text;
  const parts = text.split(new RegExp(`(${safe})`, "gi"));
  return parts.map((part, idx) =>
    part.toLowerCase() === keyword.toLowerCase() ? (
      <mark key={idx} className="bg-transparent text-brand-600 font-semibold">
        {part}
      </mark>
    ) : (
      <span key={idx}>{part}</span>
    ),
  );
};

const ReportCard = ({ report, highlightKeyword }: ReportCardProps) => {
  const impactBadge = report.impactLevel && IMPACT_COLOR[report.impactLevel];

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          <Link to={`/reports/${report.id}`} className="hover:text-brand-600">
            {highlight(report.title, highlightKeyword)}
          </Link>
        </h2>
        <span className="text-sm text-slate-500">
          {formatDate(report.date)} · {report.org ?? "未知机构"}
        </span>
      </header>

      <p className="mt-3 text-sm leading-relaxed text-slate-600 line-clamp-2">
        {report.summary
          ? highlight(report.summary, highlightKeyword)
          : "暂未提取摘要，可点击查看详情。"}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        {report.rating && (
          <span className="rounded bg-blue-100 px-2 py-1 text-blue-600">
            评级：{report.rating}
          </span>
        )}
        {typeof report.targetPrice === "number" && (
          <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-600">
            目标价：{report.targetPrice}
          </span>
        )}
        {report.stockName && (
          <span className="rounded bg-indigo-100 px-2 py-1 text-indigo-600">
            个股：{report.stockName}
          </span>
        )}
        {report.industry && (
          <span className="rounded bg-fuchsia-100 px-2 py-1 text-fuchsia-600">
            行业：{report.industry}
          </span>
        )}
        {impactBadge && (
          <span className={`rounded px-2 py-1 text-xs ${impactBadge}`}>
            影响力：{report.impactLevel === "high" ? "高" : report.impactLevel === "medium" ? "中" : "低"}
          </span>
        )}
      </div>

      {report.topicTags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
          {report.topicTags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-slate-200 px-3 py-1"
            >
              #{tag}
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link to={`/reports/${report.id}`} className="text-brand-600 hover:underline">
          查看详情
        </Link>
        {report.pdfUrl && (
          <a
            href={report.pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="text-slate-500 hover:underline"
          >
            下载 PDF
          </a>
        )}
        <a
          href={report.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="text-slate-500 hover:underline"
        >
          查看原文
        </a>
      </footer>
    </article>
  );
};

export default ReportCard;
