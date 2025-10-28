import type { Config } from "tailwindcss";

// Tailwind 配置文件，告知扫描的模板路径。
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#1f6feb", // 自定义品牌蓝色，对应东方财富风格。
          secondary: "#0c1e3e",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
