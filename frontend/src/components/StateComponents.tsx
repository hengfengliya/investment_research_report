/**
 * 状态处理组件：骨架屏、空态、错误态
 * 遵循金融极简白设计规范
 */

/**
 * 骨架屏：用于数据加载中的占位
 */
const SkeletonCard = () => (
  <div className="rounded-md border border-border-default bg-bg-secondary shadow-sm p-5 space-y-4 animate-pulse">
    {/* 分类标签骨架 */}
    <div className="flex gap-2">
      <div className="h-6 w-12 rounded bg-slate-200" />
      <div className="h-6 w-16 rounded bg-slate-200" />
    </div>

    {/* 标题骨架 */}
    <div className="space-y-2">
      <div className="h-5 w-4/5 rounded bg-slate-200" />
      <div className="h-5 w-3/5 rounded bg-slate-200" />
    </div>

    {/* 标签组骨架 */}
    <div className="flex gap-2">
      <div className="h-6 w-20 rounded-full bg-slate-200" />
      <div className="h-6 w-24 rounded-full bg-slate-200" />
    </div>

    {/* 元信息骨架 */}
    <div className="h-4 w-2/3 rounded bg-slate-200" />

    {/* 摘要骨架 */}
    <div className="space-y-2">
      <div className="h-4 w-full rounded bg-slate-200" />
      <div className="h-4 w-5/6 rounded bg-slate-200" />
    </div>

    {/* 底部操作区骨架 */}
    <div className="flex gap-2 pt-2 border-t border-border-default">
      <div className="h-8 w-20 rounded bg-slate-200" />
      <div className="h-8 w-20 rounded bg-slate-200" />
    </div>
  </div>
);

/**
 * 骨架屏容器：多个骨架卡片
 */
const SkeletonLoader = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, idx) => (
      <SkeletonCard key={idx} />
    ))}
  </div>
);

/**
 * 空态：没有数据时的提示
 */
interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState = ({
  title = "暂无数据",
  description = "调整筛选条件后重试，或者返回首页。",
  action,
}: EmptyStateProps) => (
  <div className="rounded-md border border-border-default bg-bg-secondary shadow-sm p-12 text-center">
    {/* 空态图标 */}
    <div className="mb-6 flex justify-center">
      <svg
        className="h-16 w-16 text-text-tertiary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
    </div>

    {/* 文案 */}
    <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
    <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto">{description}</p>

    {/* 操作按钮 */}
    {action && (
      <button
        onClick={action.onClick}
        className="inline-flex h-10 items-center rounded-sm bg-brand-500 px-4 text-white hover:bg-brand-600 transition-colors"
      >
        {action.label}
      </button>
    )}
  </div>
);

/**
 * 错误态：发生错误时的提示
 */
interface ErrorStateProps {
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const ErrorState = ({
  title = "加载失败",
  message,
  action,
}: ErrorStateProps) => (
  <div className="rounded-md border border-semantic-error bg-semantic-error/5 shadow-sm p-6">
    <div className="flex gap-4">
      {/* 错误图标 */}
      <div className="flex-shrink-0">
        <svg
          className="h-6 w-6 text-semantic-error"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      {/* 文案 */}
      <div className="flex-1">
        <h3 className="text-sm font-medium text-semantic-error mb-1">{title}</h3>
        <p className="text-sm text-text-secondary mb-3">{message}</p>

        {/* 操作按钮 */}
        {action && (
          <button
            onClick={action.onClick}
            className="text-sm font-medium text-semantic-error hover:text-semantic-error/80 transition-colors underline"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  </div>
);

export { SkeletonLoader, EmptyState, ErrorState };
