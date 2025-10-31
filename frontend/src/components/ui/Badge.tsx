import { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@lib/cn";

/**
 * Badge 组件：标签/徽章
 * 用于分类、标记等场景，支持多种样式和颜色
 */

const badgeVariants = cva(
  // 基础样式
  [
    "inline-flex items-center rounded px-2 py-0.5",
    "text-xs font-medium",
    "transition-colors duration-fast",
  ],
  {
    variants: {
      // 样式变体：默认带边框，filled 则填充背景
      variant: {
        // 默认样式：浅背景 + 边框
        default: "border border-border-default bg-white text-text-secondary",
        // 填充样式：深背景 + 文本
        filled: "bg-brand-50 text-brand-700 border-0",
        // 强调：品牌色背景
        primary: "bg-brand-500 text-white border-0",
        // 成功态
        success: "bg-semantic-success/10 text-semantic-success border border-semantic-success/30",
        // 警告态
        warning: "bg-semantic-warning/10 text-semantic-warning border border-semantic-warning/30",
        // 错误态
        error: "bg-semantic-error/10 text-semantic-error border border-semantic-error/30",
      },
      // 尺寸变体
      size: {
        sm: "px-1.5 py-0.5 text-xs",
        md: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  // 是否显示关闭按钮
  closable?: boolean;
  // 关闭回调
  onClose?: () => void;
  // 前缀图标
  icon?: ReactNode;
}

const Badge = ({
  className,
  variant,
  size,
  closable,
  onClose,
  icon,
  children,
  ...props
}: BadgeProps) => {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {/* 前缀图标 */}
      {icon && <span className="mr-1 flex items-center">{icon}</span>}

      {/* 内容 */}
      {children}

      {/* 关闭按钮 */}
      {closable && (
        <button
          type="button"
          onClick={onClose}
          className="ml-1 inline-flex items-center opacity-70 hover:opacity-100 transition-opacity"
          aria-label="关闭标签"
        >
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </span>
  );
};

export { Badge, badgeVariants };
export type { BadgeProps };
