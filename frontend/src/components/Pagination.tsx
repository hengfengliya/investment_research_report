import { Button } from "@components/ui";
import { useState } from "react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  // 每页条数选项
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
}

/**
 * Pagination 组件（金融极简白设计）
 * 支持：上/下一页 + 页码导航 + 快速前进（...） + 每页条数选择
 * 小屏仅显示上/下页，大屏显示完整页码
 */
const Pagination = ({
  page,
  totalPages,
  onChange,
  pageSize = 10,
  onPageSizeChange,
}: PaginationProps) => {
  const [jumpPage, setJumpPage] = useState("");

  const canPrev = page > 1;
  const canNext = page < totalPages;

  // 生成页码：显示前3页、当前页周围、后3页
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 1; // 当前页前后的页数

    // 第一页
    if (1) pages.push(1);

    // 前面的省略号
    if (page - delta > 2) {
      pages.push("...");
    }

    // 当前页前后的页码
    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      if (!pages.includes(i)) pages.push(i);
    }

    // 后面的省略号
    if (page + delta < totalPages - 1) {
      pages.push("...");
    }

    // 最后一页
    if (totalPages > 1) pages.push(totalPages);

    return pages.filter((p, idx, arr) => !(p === "..." && arr[idx + 1] === "..."));
  };

  const handleJump = () => {
    const pageNum = parseInt(jumpPage, 10);
    if (pageNum > 0 && pageNum <= totalPages) {
      onChange(pageNum);
      setJumpPage("");
    }
  };

  return (
    <div className="rounded-md border border-border-default bg-bg-secondary shadow-sm p-4 space-y-4">
      {/* 上一页 / 页码 / 下一页 */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => canPrev && onChange(page - 1)}
            disabled={!canPrev}
          >
            ← 上一页
          </Button>

          {/* 大屏显示页码导航 */}
          <div className="hidden lg:flex items-center gap-1">
            {getPageNumbers().map((p, idx) => {
              if (p === "...") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 text-text-tertiary"
                  >
                    ···
                  </span>
                );
              }

              const pageNum = p as number;
              const isActive = pageNum === page;

              return (
                <button
                  key={pageNum}
                  onClick={() => onChange(pageNum)}
                  className={`h-8 w-8 rounded-sm text-sm font-medium transition-all ${
                    isActive
                      ? "bg-brand-500 text-white"
                      : "border border-border-default bg-bg-secondary text-text-primary hover:bg-slate-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* 小屏显示文本 */}
          <span className="text-sm text-text-secondary lg:hidden">
            第 {page} / {totalPages} 页
          </span>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => canNext && onChange(page + 1)}
            disabled={!canNext}
          >
            下一页 →
          </Button>
        </div>

        {/* 每页条数选择 */}
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <label htmlFor="pageSize" className="text-sm text-text-secondary">
              每页显示：
            </label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
              className="h-8 rounded-sm border border-border-default bg-bg-secondary px-2 text-sm text-text-primary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        )}
      </div>

      {/* 快速跳转 */}
      <div className="flex items-center gap-2 pt-2 border-t border-border-default">
        <label htmlFor="jumpPage" className="text-sm text-text-secondary">
          快速跳转至：
        </label>
        <input
          id="jumpPage"
          type="number"
          min="1"
          max={totalPages}
          value={jumpPage}
          onChange={(e) => setJumpPage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleJump()}
          placeholder="页码"
          className="h-8 w-16 rounded-sm border border-border-default bg-bg-secondary px-2 text-sm text-text-primary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        />
        <Button variant="primary" size="sm" onClick={handleJump}>
          前往
        </Button>
        <span className="text-xs text-text-tertiary">共 {totalPages} 页</span>
      </div>
    </div>
  );
};

export default Pagination;

