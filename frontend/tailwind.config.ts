import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import lineClamp from "@tailwindcss/line-clamp";

// Tailwind 配置：扫描模板、扩展品牌色（黑/白/橙）与常用插件
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
  plugins: [forms(), lineClamp()],
} satisfies Config;

