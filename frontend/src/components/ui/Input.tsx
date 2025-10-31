import { ReactNode, forwardRef } from "react";
import { cn } from "@lib/cn";

/**
 * Input 组件：基础输入框
 * 支持前/后缀图标、清空按钮等
 */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // 前缀图标
  prefixIcon?: ReactNode;
  // 后缀图标
  suffixIcon?: ReactNode;
  // 是否显示清空按钮
  clearable?: boolean;
  // 清空回调
  onClear?: () => void;
  // 是否显示错误状态
  isError?: boolean;
  // 错误提示
  errorMessage?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      prefixIcon,
      suffixIcon,
      clearable,
      onClear,
      isError,
      errorMessage,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const isClearVisible = clearable && value;

    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {/* 前缀图标 */}
          {prefixIcon && (
            <div className="pointer-events-none absolute left-3 flex items-center text-text-secondary">
              {prefixIcon}
            </div>
          )}

          {/* 输入框 */}
          <input
            ref={ref}
            className={cn(
              // 基础样式
              "h-10 w-full rounded-sm border bg-bg-secondary text-text-primary transition-all duration-fast",
              "placeholder:text-text-tertiary",
              // 边框样式
              isError
                ? "border-semantic-error focus-visible:ring-semantic-error/40"
                : "border-border-default focus-visible:ring-brand-500/40",
              // 焦点环
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
              // 内边距：考虑前后缀
              prefixIcon && "pl-10",
              (suffixIcon || isClearVisible) && "pr-10",
              !prefixIcon && !suffixIcon && !isClearVisible && "px-3",
              className
            )}
            value={value}
            onChange={onChange}
            {...props}
          />

          {/* 清空按钮或后缀图标 */}
          {isClearVisible && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-3 flex items-center text-text-tertiary hover:text-text-secondary transition-colors"
              aria-label="清空输入"
            >
              <svg
                className="h-4 w-4"
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
          ) : (
            suffixIcon && (
              <div className="pointer-events-none absolute right-3 flex items-center text-text-secondary">
                {suffixIcon}
              </div>
            )
          )}
        </div>

        {/* 错误提示 */}
        {isError && errorMessage && (
          <p className="mt-1 text-xs text-semantic-error">{errorMessage}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
export type { InputProps };
