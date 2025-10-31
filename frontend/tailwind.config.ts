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
      // 颜色体系：极简黑白 + 暗金强调色
      colors: {
        // 品牌暗金色：#D4AF37 作为强调色
        brand: {
          50: "#FDF8F0",
          100: "#F9F1E3",
          500: "#D4AF37", // 主色（暗金）
          600: "#C4A030", // Hover
          700: "#B49225", // Active
        },
        // 背景色：极简黑白
        bg: {
          primary: "#FFFFFF", // 页面背景（白）
          secondary: "#F8F8F8", // 卡片背景（极浅灰）
          tertiary: "#000000", // 深色背景（黑）
        },
        // 分隔线与边框
        border: {
          default: "#E0E0E0", // 浅灰边框
          dark: "#333333", // 深灰边框
        },
        // 文本颜色
        text: {
          primary: "#000000", // 主文本（黑）
          secondary: "#666666", // 次文本（深灰）
          tertiary: "#999999", // 弱文本（中灰）
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

