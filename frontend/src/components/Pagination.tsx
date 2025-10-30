interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

/**
 * Pagination 组件：提供“上一页/下一页”基础分页
 */
const Pagination = ({ page, totalPages, onChange }: PaginationProps) => {
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex items-center justify-between rounded border border-slate-200 bg-white px-4 py-2">
      <button
        onClick={() => canPrev && onChange(page - 1)}
        disabled={!canPrev}
        className="rounded px-3 py-1 text-sm text-slate-600 disabled:text-slate-300"
      >
        上一页
      </button>

      <span className="text-sm text-slate-500">
        第 {page} / {totalPages} 页
      </span>

      <button
        onClick={() => canNext && onChange(page + 1)}
        disabled={!canNext}
        className="rounded px-3 py-1 text-sm text-slate-600 disabled:text-slate-300"
      >
        下一页
      </button>
    </div>
  );
};

export default Pagination;

