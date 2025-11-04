import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardBody, CardTitle, Badge, Button } from "@components/ui";
import { SkeletonLoader, ErrorState } from "@components/StateComponents";
import { getReportDetail } from "@lib/api";
import type { Report } from "@shared-types/report";

/**
 * 格式化日期时间（YYYY-MM-DD）
 */
const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("zh-CN");
};

/**
 * ReportDetailPage：研报详情页（金融极简白设计）
 */
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
      .catch((err) => setError(err instanceof Error ? err.message : "加载失败，请稍后重试"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <SkeletonLoader count={2} />;
  }

  if (error) {
    return (
      <ErrorState
        title="加载失败"
        message={error}
        action={{
          label: "返回列表",
          onClick: () => window.history.back(),
        }}
      />
    );
  }

  if (!report) {
    return (
      <ErrorState
        title="未找到研报"
        message="该研报可能已被删除或已过期，请返回列表重新选择。"
        action={{
          label: "返回列表",
          onClick: () => window.history.back(),
        }}
      />
    );
  }

  const impactLevelText = {
    high: "高",
    medium: "中",
    low: "低",
  };

  return (
    <article className="space-y-6">
      {/* 返回按钮 */}
      <Link
        to="/"
        className="inline-flex text-sm text-link-default hover:text-opacity-80 transition-colors"
      >
        ← 返回列表
      </Link>

      {/* 标题与基本信息 */}
      <Card>
        <CardBody className="space-y-4">
          <h1 className="text-2xl font-bold text-text-primary">{report.title}</h1>

          {/* 元信息 */}
          <div className="flex flex-wrap gap-2 text-sm text-text-secondary">
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

          {/* 标签组 */}
          {(report.rating || report.stockName || report.industry || report.impactLevel) && (
            <div className="flex flex-wrap gap-2">
              {report.category && (
                <Badge variant="default" size="sm">
                  {report.category === "strategy" && "策略"}
                  {report.category === "macro" && "宏观"}
                  {report.category === "industry" && "行业"}
                  {report.category === "stock" && "个股"}
                </Badge>
              )}
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
              {report.industry && (
                <Badge variant="default" size="sm">
                  行业：{report.industry}
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
        </CardBody>
      </Card>

      {/* 研报摘要 */}
      <Card>
        <CardBody className="space-y-3">
          <CardTitle>研报摘要</CardTitle>
          <p className="leading-relaxed text-text-secondary">
            {report.summary ?? "暂未提取摘要，可通过原文/PDF 查看详细内容。"}
          </p>
        </CardBody>
      </Card>

      {/* 下载 PDF */}
      {report.pdfUrl && (
        <Card>
          <CardBody className="space-y-3">
            <CardTitle>获取原文</CardTitle>
            <div className="flex flex-wrap gap-3">
              <a href={report.pdfUrl} target="_blank" rel="noreferrer">
                <Button variant="primary" size="sm">
                  下载 PDF
                </Button>
              </a>
            </div>
          </CardBody>
        </Card>
      )}

      {/* 主题标签 */}
      {report.topicTags.length > 0 && (
        <Card>
          <CardBody className="space-y-3">
            <CardTitle>主题标签</CardTitle>
            <div className="flex flex-wrap gap-2">
              {report.topicTags.map((tag) => (
                <Badge key={tag} variant="default" size="md">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </article>
  );
};

export default ReportDetailPage;
