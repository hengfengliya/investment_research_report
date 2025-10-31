import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

/**
 * Tailwind 配置：遵循设计令牌规范（金融极简白 × YouMind）
 * 核心原则：高留白、中性灰文字、细分隔线、轻阴影、克制动效
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // 颜色体系：黑/白/暗金色
      colors: {
        // 品牌暗金色：主要用于主按钮、强调、焦点环
        brand: {
          50: "#FBF8F3",
          100: "#F5EFE7",
          400: "#B8860B", // 浅金色
          500: "#8B6914", // 主色（暗金）
          600: "#6B5410", // Hover
          700: "#4A3A0A", // Active
        },
        // 背景色
        bg: {
          primary: "#FAFAFA", // 页面背景
          secondary: "#FFFFFF", // 卡片背景
        },
        // 分隔线与边框
        border: {
          default: "#EAECF0",
        },
        // 文本颜色
        text: {
          primary: "#101828", // 主文本
          secondary: "#475467", // 次文本
          tertiary: "#98A2B3", // 弱文本
        },
        // 链接色（与品牌橙并存）
        link: {
          default: "#1F6FEB",
        },
        // 语义色
        semantic: {
          success: "#16A34A",
          warning: "#F59E0B",
          error: "#DC2626",
        },
      },
      // 圆角刻度
      borderRadius: {
        sm: "8px", // 按钮、输入框
        md: "12px", // 卡片
      },
      // 阴影：sm/md，避免重阴影
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0,0,0,0.05)", // 默认阴影
        md: "0 4px 6px -1px rgba(0,0,0,0.1)", // Hover 时阴影
      },
      // 间距刻度：4/8/12/16/24/32
      spacing: {
        gutter: "24px", // 区块间距
        "gutter-lg": "32px", // 大区块间距
      },
      // 动画与过渡：克制动效（≤120ms）
      transitionDuration: {
        fast: "120ms",
      },
      // 焦点环：统一 focus-visible
      outline: {
        ring: "2px solid rgba(255,122,26,0.40)",
      },
    },
  },
  plugins: [forms()],
} satisfies Config;

