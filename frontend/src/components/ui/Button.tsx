import { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@lib/cn";

/**
 * Button 组件：基础按钮基元
 * 支持三种样式：主（橙）、次（描边）、幽灵（无背景）
 */
const buttonVariants = cva(
  // 基础样式：尺寸、排列、过渡、焦点环
  [
    "inline-flex items-center justify-center",
    "h-10 px-4 rounded-sm",
    "font-medium text-sm",
    "transition-colors duration-fast",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ],
  {
    variants: {
      // 样式变体
      variant: {
        // 主按钮（橙）：用于主操作
        primary: [
          "bg-brand-500 text-white",
          "hover:bg-brand-600",
          "active:bg-brand-700",
        ],
        // 次按钮（描边）：用于次操作
        secondary: [
          "border border-border-default bg-bg-secondary text-text-primary",
          "hover:bg-slate-50",
          "active:bg-slate-100",
        ],
        // 幽灵按钮（无背景）：用于轻量操作
        ghost: [
          "text-text-secondary",
          "hover:bg-slate-100",
          "active:bg-slate-200",
        ],
        // 链接按钮：文本样式
        link: [
          "text-link-default underline",
          "hover:opacity-80",
          "active:opacity-60",
        ],
      },
      // 尺寸变体
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  // 是否显示加载状态
  isLoading?: boolean;
  // 自定义图标
  icon?: ReactNode;
  // 图标位置
  iconPosition?: "left" | "right";
}

const Button = ({
  className,
  variant,
  size,
  isLoading,
  icon,
  iconPosition = "left",
  disabled,
  children,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* 显示加载状态时，用转圈图标替代文本 */}
      {isLoading ? (
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <>
          {icon && iconPosition === "left" && (
            <span className="mr-2 flex items-center">{icon}</span>
          )}
          {children}
          {icon && iconPosition === "right" && (
            <span className="ml-2 flex items-center">{icon}</span>
          )}
        </>
      )}
    </button>
  );
};

export { Button, buttonVariants };
export type { ButtonProps };
