import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

// Tailwind 配置：扫描模板、扩展品牌色（黑/白/橙）与常用插件
// 注意：line-clamp 在 Tailwind v3+ 中已集成到核心中，无需额外插件
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#FF7A1A", // 主色（橙）
          secondary: "#0c1e3e",
          500: "#FF7A1A",
          600: "#E56E10",
          700: "#C85B10",
        },
      },
    },
  },
  plugins: [forms()],
} satisfies Config;

