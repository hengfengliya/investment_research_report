import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// 通过 defineConfig 提供智能提示，简化 Vite 配置。
export default defineConfig({
  plugins: [react()], // 启用 React 插件，支持 JSX 与 Fast Refresh。
  resolve: {
    alias: {
      "@components": path.resolve(__dirname, "src/components"),
      "@pages": path.resolve(__dirname, "src/pages"),
      "@lib": path.resolve(__dirname, "src/lib"),
      "@shared-types": path.resolve(__dirname, "src/types"),
    },
  },
  server: {
    port: 5173,
  },
});
