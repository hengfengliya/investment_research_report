# 开发进度记录

## 当前进度
- 本地前后端可按照 docs/local-dev.md 文档联调，React 前端在 VITE_API_BASE_URL=http://localhost:4000/api 下能够成功获取研报列表与分类数据。
- Prisma 客户端在构建阶段会生成 Linux (debian-openssl-3.0.x) 与本机二进制，ackend/scripts/postbuild.mjs 会将运行时复制到 ackend/dist/node_modules，保证 Vercel Serverless 可直接加载。
- Vercel Functions 中的 pi/reports.ts、pi/categories.ts 等文件明确注册了路径，并打印请求入参、响应结束日志，方便线上排查。

## 已处理的难点
- **CORS**：本地联调提示 Failed to fetch，通过在 ackend/server.ts 中增加 pp.use("/api/*", cors()) 处理跨域。
- **Prisma 连接**：线上初始化曾阻塞，移除 channel_binding=require 参数并显式调用 $connect()，同时输出成功/失败日志。
- **Prisma 二进制缺失**：Windows 生成的包缺少 Linux 查询引擎，已在 schema.prisma 设置 inaryTargets = ["native", "debian-openssl-3.0.x"] 并在打包阶段复制 .prisma 目录。
- **Hono 路由未命中**：早期未显式指定路径导致请求挂起，现已在各函数中注册 /、/reports、/categories 等路径并打印 c.req.path。

## Timeout 排查记录
1. **日志加固**：
   - 在 Prisma 初始化、数据库查询、API 响应阶段加入详细日志，确认执行流程。
2. **构建优化**：
   - 
pm run vercel-build 按 prisma generate -> backend build -> frontend build 顺序执行，确保部署包包含 Linux 引擎。
3. **路由调整**：
   - 去除兜底 pp.all("*")，只保留实际路径，避免请求悬挂；同时打印实际 path 以确认命中。
4. **响应确认**：
   - 在 API 返回前输出 “响应结束” 日志，用来判断是否在 300 秒内完成响应。

## 待办事项
- **继续定位 504**：当前日志显示查询与响应均成功完成，但 Vercel 仍报告超时，需继续观察是否存在响应流未关闭或大数据传输问题，可考虑 Response Streaming 或提前结束响应。
- **缓存与后台任务**：根据线上耗时情况，计划引入 Redis/Vercel KV 缓存热点数据，或将耗时同步改为后台任务，避免占用前台请求 5 分钟时限。
- **部署复核**：待 Vercel 新部署完成后收集带“响应结束”日志的完整输出，继续观察是否仍触发 300 秒超时，并记录后续优化方案。

> 说明：后续若增加缓存/后台任务或其他优化，需要在本记录更新阶段性结果，方便追踪。
