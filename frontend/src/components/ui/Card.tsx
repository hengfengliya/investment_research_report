import { ReactNode } from "react";
import { cn } from "@lib/cn";

/**
 * Card 组件：基础卡片容器
 * 采用白底 + 分隔线 + 轻阴影的设计
 */

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  // 是否显示 hover 效果（用于可交互的卡片）
  interactive?: boolean;
  // 是否显示分隔线
  divided?: boolean;
}

const Card = ({
  className,
  interactive = false,
  divided = true,
  ...props
}: CardProps) => {
  return (
    <div
      className={cn(
        // 基础样式：白底、圆角、边框、阴影
        "rounded-md bg-bg-secondary",
        divided ? "border border-border-default" : "border-0",
        "shadow-sm",
        // 交互效果：hover 时轻抬起 + 增加阴影
        interactive && "transition-all duration-fast hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
        className
      )}
      {...props}
    />
  );
};

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardHeader = ({ className, ...props }: CardHeaderProps) => (
  <div className={cn("border-b border-border-default px-5 py-4", className)} {...props} />
);

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardBody = ({ className, ...props }: CardBodyProps) => (
  <div className={cn("px-5 py-4", className)} {...props} />
);

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardFooter = ({ className, ...props }: CardFooterProps) => (
  <div
    className={cn("border-t border-border-default px-5 py-3", className)}
    {...props}
  />
);

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const CardTitle = ({ className, ...props }: CardTitleProps) => (
  <h3
    className={cn(
      "text-lg font-semibold text-text-primary",
      className
    )}
    {...props}
  />
);

interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = ({ className, ...props }: CardDescriptionProps) => (
  <p className={cn("text-sm text-text-secondary", className)} {...props} />
);

export {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  CardTitle,
  CardDescription,
};
export type { CardProps };
