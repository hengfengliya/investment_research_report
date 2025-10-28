import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getReportDetail } from "@lib/api";
import type { Report } from "@types/report";

const formatDateTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("zh-CN");
};

const ReportDetailPage = () => {
  const { id } = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    getReportDetail(id)
      .then(setReport)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "加载失败"),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="rounded border border-slate-200 bg-white p-6 text-center text-slate-500">
        正在加载研报详情，请稍候…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-4 text-red-600">
        {error}
      </div>
    );
  }

  if (!report) {
    return (
      <div className="rounded border border-slate-200 bg-white p-6 text-center text-slate-500">
        未查询到该研报，可能已经被删除。
      </div>
    );
  }

  return (
    <article className="space-y-5">
      <header className="space-y-2 rounded bg-white p-6 shadow">
        <Link to="/" className="text-sm text-brand-primary hover:underline">
          ← 返回列表
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">{report.title}</h1>
        <p className="text-sm text-slate-500">
          {formatDateTime(report.date)} · {report.org ?? "未知机构"} ·{" "}
          {report.author ?? "作者未公布"}
        </p>
        <div className="flex flex-wrap gap-2 text-sm">
          {report.rating && (
            <span className="rounded bg-blue-100 px-3 py-1 text-blue-600">
              评级：{report.rating}
            </span>
          )}
          {report.stockName && (
            <span className="rounded bg-indigo-100 px-3 py-1 text-indigo-600">
              个股：{report.stockName}
              {report.stockCode ? `（${report.stockCode}）` : ""}
            </span>
          )}
          {report.industry && (
            <span className="rounded bg-fuchsia-100 px-3 py-1 text-fuchsia-600">
              行业：{report.industry}
            </span>
          )}
          {report.impactLevel && (
            <span className="rounded bg-amber-100 px-3 py-1 text-amber-600">
              影响力：
              {report.impactLevel === "high"
                ? "高"
                : report.impactLevel === "medium"
                  ? "中"
                  : "低"}
            </span>
          )}
        </div>
      </header>

      <section className="rounded bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-slate-900">研报摘要</h2>
        <p className="mt-3 leading-relaxed text-slate-700">
          {report.summary ?? "暂未提取摘要，可通过原文或 PDF 查看详细内容。"}
        </p>
      </section>

      <section className="rounded bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-slate-900">下载与原文</h2>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          {report.pdfUrl && (
            <a
              href={report.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="text-brand-primary hover:underline"
            >
              下载 PDF
            </a>
          )}
          <a
            href={report.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-slate-600 hover:underline"
          >
            查看东方财富原文
          </a>
        </div>
      </section>

      {report.topicTags.length > 0 && (
        <section className="rounded bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-slate-900">主题标签</h2>
          <ul className="mt-3 flex flex-wrap gap-2 text-sm text-slate-600">
            {report.topicTags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-slate-200 px-3 py-1"
              >
                #{tag}
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
};

export default ReportDetailPage;
