# 项目开发进度日志（实时更新）

> 更新时间：2025-10-28 20:45（UTC+8）  
> 维护人：Codex（开发助手）

## ✅ 已完成
- 梳理 PRD 并输出实施计划（docs/implementation-plan.md），明确 MVP 范围、目录约束。
- 后端（Bun + Hono + Prisma）骨架：模型、分页筛选、详情、分类统计、同步 API 均已就绪。
- 爬虫脚本支持东方财富四类研报抓取，完成详情解析、去重入库，当前数据库已有 39 条样例数据。
- 前端（Vite + React + Tailwind）实现筛选、列表、详情、关于等页面，已可在本地、Vercel 正常构建。
- 整合为单一 Vercel 项目结构：`api/` 目录提供 Serverless 接口，`frontend/dist` 输出静态页面；新增 `backend/server.ts` 便于本地联调。

## 🔄 进行中
- 暂无（等待新任务）。

## 📅 待办 / 下一步

### 1. 在 Vercel 配置环境变量并重新部署
1. 进入 Vercel 控制台 → 选择当前项目 → `Settings → Environment Variables`。
2. 逐条添加以下键值（若已有可更新）：
   - `DATABASE_URL`  
     `postgresql://neondb_owner:npg_me91zWbTBDpj@ep-steep-unit-adwx68g1-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
   - `SYNC_SECRET`  
     `demo-secret-key`
   - `VITE_API_BASE_URL`  
     `/api`
3. 保存后回到 `Deployments` 页面，执行 `Redeploy`（或推送一次 git）。构建完成即生效：前端静态文件来自 `frontend/dist`，接口走同域 `/api/*`。

### 2. 搭建自动同步任务（建议）
1. 打开 GitHub 仓库 → `Actions` → `New workflow`。
2. 创建一个计划任务（例如 Cron `0 */6 * * *` 每 6 小时）。
3. 工作流步骤示例：
   ```yaml
   - uses: actions/checkout@v4
   - uses: oven-sh/setup-bun@v1
   - run: bun install
   - run: bun run backend/scripts/sync-runner.ts
     env:
       DATABASE_URL: ${{ secrets.DATABASE_URL }}
   ```
4. 在仓库 `Settings → Secrets and variables → Actions` 中配置 `DATABASE_URL`、`SYNC_SECRET` 等敏感信息。
5. 运行后可在 Actions 日志中查看同步结果。

### 3. 增强同步脚本的容错与日志（计划）
1. 在 `backend/scripts/fetch-list.ts` / `sync-runner.ts` 中增加失败重试：对单条请求设置最多 3 次重试、指数退避。
2. 引入日志模块（例如 `pino` 或简单写入文件），把异常、成功统计写入 `logs/` 目录或外部服务。
3. 预留告警方式（Email / 飞书 Webhook），一旦连续失败可通知运维。
4. 完成后更新 README，说明如何查看日志与调整重试策略。

> 如需新增任务或调整优先级，请直接告诉我，我会实时更新此日志。
