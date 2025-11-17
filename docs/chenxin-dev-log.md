# 辰星投研前端融合开发记录

> 最后更新：2025-11-17

## 本轮更新摘要
- 将原 `frontend/` 中的质点智库 + 辰星 AI 融合方案拎出，建立独立仓库 **hengfengliya/chenxin**，结构化为标准的 Vite + React + TS 项目，便于 Vercel 直接部署。
- 新站点包含三个主页面：`首页`（引导 CTA）、`智库`（级联行业筛选 + 报告弹窗）、`辰星 AI`（模式化输入 + 对话占位），UI 统一沿用 investment 项目的黑白 + 暗金设计语言。
- 保留 `public/reports/*.html` 作为报告占位文件；后续若有 CMS 或富文本，可以直接替换，无需改动组件层。
- 新仓库引入 `.gitignore`、`tsconfig`、`tailwind` 自身配置，并在 `vite.config.ts` / `tsconfig.json` 中声明 `@layouts`、`@data` 等别名，确保组件引用清晰。

## 关键变更
1. **目录拆分**
   - `C:\Users\18805\Desktop\cx\chenxin` 为独立前端仓库，历史记录从 `feat: setup chenxin frontend repo`（43003ea）开始。
   - 原 `investment-research-report` 仍保留全栈结构，不再承担前端部署职责。
2. **导航与布局**
   - `src/components/navigation/TopNav.tsx`：顶部导航含「首页/智库/辰星AI/免费报告」及右侧登录/模式/语言占位按钮。
   - `src/layouts/MainLayout.tsx`：固定导航 + 居中内容区 + 统一留白。
3. **页面与数据**
   - `src/pages/home/HomeLanding.tsx`：展示产品定位与 CTA。
   - `src/pages/think-tank/**` + `src/data/thinkTank*.ts`：多级行业筛选、搜索、统计、报告弹窗。
   - `src/pages/ai/ChenxinAIPage.tsx` + `src/data/aiModes.ts`：AI 模式化交互与对话占位。
   - `src/lib/useThinkTankFilters.ts`：统一管理搜索/筛选数据流。

## 待办 & 后续规划
1. **数据/接口接入**
   - 当前 AI 页面仅为前端模拟，需要接入真实 API（消息流、Streaming、鉴权等）。
   - 报告数据来自静态文件，后续可与后台联动（REST/GraphQL/CMS）。
2. **多语言 / 主题**
   - 顶部导航已留有「模式、语言」按钮，占位待实现。
   - 暗色模式设计尚未实现，需要补充 token 与样式切换逻辑。
3. **部署自动化**
   - Vercel 项目需指向 `hengfengliya/chenxin`，Build 命令 `npm run build`，Output `dist/`。
   - 若需要多环境（Preview/Prod）或自动 lint，考虑加入 GitHub Actions。
4. **回归旧仓库**
   - `investment-research-report` 中的 `frontend/` 可视情况删除或改为指向 `chenxin` 的 Git submodule，避免维护双份代码。

## 环境/命令速览
```bash
# 本地开发
npm install
npm run dev

# 构建
npm run build   # 输出到 dist/

# Git 推送
git add .
git commit -m "feat: xxx"
git push origin main
```

如需后续在 Vercel 上设置环境变量、后端接口代理等，可在本文件继续补充。***
