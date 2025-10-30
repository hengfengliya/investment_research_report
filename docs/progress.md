# 开发进度记录

## 当前进度
- 本地前后端可按照 docs/local-dev.md 文档联调，React 前端在 VITE_API_BASE_URL=http://localhost:4000/api 下能够成功获取研报列表与分类数据。
- Prisma 客户端在构建阶段会生成 Linux (debian-openssl-3.0.x) 与本机二进制，ackend/scripts/postbuild.mjs 会将运行时复制到 ackend/dist/node_modules，保证 Vercel Serverless 可直接加载。
- Vercel Functions 中的 pi/reports.ts、pi/categories.ts 等文件明确注册了路径，并打印请求入参、响应结束日志，方便线上排查。

## 已处理的难点
- **CORS**：本地联调提示 Failed to fetch，通过在 ackend/server.ts 中增加 pp.use("/api/*", cors()) 处理跨域。
- **Prisma 连接**：线上初始化曾阻塞，移除 channel_binding=require 参数并显式调用 $connect()，同时输出成功/失败日志。
- **Prisma 二进制缺失**：Windows 生成的包缺少 Linux 查询引擎，已在 schema.prisma 设置 inaryTargets = ["native", "debian-openssl-3.0.x"] 并在打包阶段复制 .prisma 目录。
- **Hono 路由未命中**：早期未显式指定路径导致请求挂起，现已在各函数中注册 /、/reports、/categories 等路径并打印 c.req.path。

## Timeout 排查记录
1. **日志加固**：
   - 在 Prisma 初始化、数据库查询、API 响应阶段加入详细日志，确认执行流程。
2. **构建优化**：
   - npm run vercel-build 按 prisma generate -> backend build -> frontend build 顺序执行，确保部署包包含 Linux 引擎。
3. **路由调整**：
   - 去除兜底 pp.all("*")，只保留实际路径，避免请求悬挂；同时打印实际 path 以确认命中。
4. **响应确认**：
   - 在 API 返回前输出 "响应结束" 日志，用来判断是否在 300 秒内完成响应。

## 待办事项
- **继续定位 504**：当前日志显示查询与响应均成功完成，但 Vercel 仍报告超时，需继续观察是否存在响应流未关闭或大数据传输问题，可考虑 Response Streaming 或提前结束响应。
- **缓存与后台任务**：根据线上耗时情况，计划引入 Redis/Vercel KV 缓存热点数据，或将耗时同步改为后台任务，避免占用前台请求 5 分钟时限。
- **部署复核**：待 Vercel 新部署完成后收集带"响应结束"日志的完整输出，继续观察是否仍触发 300 秒超时，并记录后续优化方案。

> 说明：后续若增加缓存/后台任务或其他优化，需要在本记录更新阶段性结果，方便追踪。

## 追加分析（2025-10-30）
- 最新一版部署的 Vercel Function 日志显示，listReports 查询与 API 响应在几百毫秒内完成，并输出 "响应结束"，但函数仍在 5 分钟后超时，说明主逻辑已结束但仍有尾部异步任务未释放。
- 初步定位为 ackend/lib/prisma.ts 中的默认行为：创建客户端时立即执行 client.()（并挂一个 Promise），以及注册的 process.on('beforeExit', ...) 钩子会在 Lambda 退出前再次执行异步 $disconnect()。这些后台 Promise 即便在响应返回后仍然运行，导致事件循环不为空，从而触发 300 秒超时。
- 下一步计划：移除 createPrismaClient() 中的即时 $connect() 与 eforeExit 钩子，仅依赖各个 service 函数中 inally 的断连逻辑；完成后重新部署验证是否还有超时。

## 数据抓取日期处理修复（2025-10-30）

### 问题发现
- 用户反映发布日期（`report.date`）字段存储错误，显示为 `2025-10-27T16:00:00.000Z` 而非 `2025-10-27T00:00:00.000Z`
- 根本原因：JavaScript 的 `new Date("2025-10-27")` 会按 UTC 解析，但本地时区为 UTC+8 会导致时区偏移
- 影响范围：409 条历史数据全部错误，新抓取数据仍使用旧逻辑继续出错

### 修复方案
在 `backend/scripts/sync-runner.ts` 中优化 `ensureDate()` 函数，使用 `Date.UTC()` 确保日期始终为 UTC 午夜：

```typescript
const ensureDate = (value: unknown) => {
  const raw = value as string | undefined;
  if (!raw) return new Date();

  // API 返回格式：2025-10-30 00:00:00.000
  // 提取 YYYY-MM-DD 部分，忽略时间
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, yearStr, monthStr, dayStr] = match;
    // 创建当天的 UTC 午夜时间，避免时区偏移
    return new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, Number(dayStr), 0, 0, 0, 0));
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};
```

### 执行步骤
1. 清空数据库中的 268 条旧数据
2. 运行优化后的脚本抓取新数据（`SYNC_LOOKBACK_DAYS=2`）
3. 验证新数据日期格式

### 验证结果
✅ **测试通过**（2025-10-30 13:00 UTC）
- 抓取 268 条新报告，日期范围 2025-10-28 ~ 2025-10-30
- 全部报告的 `date` 字段格式正确：`2025-10-30T00:00:00.000Z`（UTC 午夜）
- `createdAt` 字段保持精确时间戳：`2025-10-30T12:44:32.669Z`
- 无任何时区偏移错误

### GitHub Actions 自动化
- ✅ 已确认每天 UTC 22:00 (北京时间 06:00) 自动运行
- ✅ 环境变量：`SYNC_LOOKBACK_DAYS=2`、`SYNC_CONCURRENCY=8`
- ✅ 后续每日自动抓取最近 2 天数据，使用正确的日期处理逻辑
