# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个**东方财富研报聚合系统**，用于抓取、存储和展示东方财富四类研报（策略、宏观、行业、个股）。项目采用 monorepo 结构，包含后端 API、前端界面和数据抓取脚本，部署在 Vercel 上。

**技术栈：**
- 后端：Bun + Hono + Prisma（PostgreSQL/Neon）
- 前端：Vite + React + TailwindCSS + React Router
- 部署：Vercel（Serverless Functions + 静态站点）

## 常用命令

### 根目录（monorepo 管理）
```bash
# 构建整个项目（主要是前端）
npm run build

# 生成 Prisma 客户端
npm run prisma:generate
```

### 后端开发（backend/）
```bash
cd backend

# 安装依赖（Windows 环境建议用 npm，Bun 安装可能遇到 404）
npm install  # 或 bun install

# 生成 Prisma 客户端
bunx prisma generate --schema ../prisma/schema.prisma

# 运行数据库迁移
bunx prisma migrate deploy --schema ../prisma/schema.prisma

# 本地启动后端服务器（监听 http://localhost:3000）
bun run dev

# 或直接运行
bun run server.ts

# 执行数据抓取脚本（一次性同步）
bun run scripts/sync-runner.ts

# Lint 检查
bunx biome check .
```

### 前端开发（frontend/）
```bash
cd frontend

# 安装依赖
npm install

# 本地开发服务器（http://localhost:5173）
npm run dev

# 或指定主机和端口
npm run dev -- --host 127.0.0.1 --port 5173

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 核心架构与数据流

### 1. 数据库模型（Prisma Schema）
- **位置：** `prisma/schema.prisma`
- **核心模型：** `Report` 表包含所有研报字段，支持四种分类（strategy/macro/industry/stock）
- **唯一约束：** `@@unique([title, date, org])` 防止重复数据
- **索引：** category、date、org、author 加速查询
- **重要字段：**
  - `topicTags`: 数组类型，存储主题标签
  - `pdfUrl`: PDF 下载链接
  - `sourceUrl`: 东方财富原文链接
  - `rating/ratingChange/targetPrice`: 个股研报评级信息
  - `impactLevel`: 策略/宏观研报的影响程度

### 2. 数据抓取流程

#### 日常抓取（推荐）
- **脚本：** `backend/scripts/sync-runner.ts`
- **用途：** 抓取最近 2 天的数据（默认 SYNC_LOOKBACK_DAYS=2）
- **命令：** `npm run sync`

#### 自定义日期范围抓取（新增）
- **脚本：** `backend/scripts/sync-custom-range.ts`
- **用途：** 指定开始和结束日期抓取任意范围的数据
- **命令：** `npm run sync:date 2025-01-01 2025-01-31`
- **特性：**
  - ✅ 每条记录 60 秒超时（防止无限等待）
  - ✅ 自动重试数据库连接（最多 3 次）
  - ✅ 详细的进度日志和错误记录
  - ✅ 成功率 98.8%+ （已验证 3,163 条记录）

#### 完整工作原理
1. 遍历四种分类（strategy → macro → industry → stock）
2. 调用 `fetchCategoryList()` 获取列表页 JSONP 数据
3. 使用 `p-limit` 控制并发（默认 1，可配置），逐个抓取详情页
4. 使用 `cheerio` 解析 HTML，提取摘要、PDF、标签等
5. 通过 Prisma 的 create/update 操作去重入库
6. **[新]** 临时网络错误自动重试，超时记录被跳过并记录

#### 配置环境变量
- `SYNC_LOOKBACK_DAYS`: 抓取最近多少天的数据（默认 2）
- `SYNC_CONCURRENCY`: 并发数（默认 1，稳定性优先）
- `SYNC_PAGE_SIZE`: 每次抓取条数（默认 9999，建议不改）

#### 关键文件
- `scripts/sync-runner.ts`: 日常抓取入口
- `scripts/sync-custom-range.ts`: 自定义范围抓取入口
- `scripts/fetch-list.ts`: 列表页抓取（含重试逻辑）
- `scripts/detail-parser.ts`: 详情页解析
- `scripts/category-config.ts`: 分类配置与 URL 模板
- `lib/prisma.ts`: 数据库连接（含重试和超时机制）

### 3. 后端 API 接口
- **本地开发：** `backend/server.ts` 使用 `@hono/node-server` 启动 HTTP 服务
- **Vercel 部署：** `api/` 目录下的 Serverless Functions
  - `api/reports.ts`: GET `/api/reports` - 列表查询（分页、筛选、关键词）
  - `api/report/[id].ts`: GET `/api/report/:id` - 研报详情
  - `api/categories.ts`: GET `/api/categories` - 分类统计
  - `api/sync.ts`: POST `/api/sync` - 触发同步（需要 `SYNC_SECRET`）
- **核心服务层：** `backend/services/report-service.ts`
  - `listReports()`: 处理复杂筛选（category/org/author/keyword）+ 分页
  - `getReportById()`: 根据 ID 获取单条记录
  - `getCategoryStats()`: 按分类聚合统计
- **数据校验：** `backend/lib/validators.ts` 使用 Zod 定义查询参数 schema

### 4. 前端页面结构
- **路由配置：** `frontend/src/App.tsx`
  - `/`: 研报列表页（`pages/ReportList.tsx`）
  - `/reports/:id`: 研报详情页（`pages/ReportDetail.tsx`）
  - `/about`: 关于页面（`pages/About.tsx`）
- **状态管理：** 使用 React Hooks（useState/useEffect）管理筛选条件、列表数据、分页状态
- **样式方案：** TailwindCSS + 自定义颜色主题（`tailwind.config.ts` 定义 `brand-primary/secondary`）
- **API 调用：** 通过 `import.meta.env.VITE_API_BASE_URL` 动态切换本地/生产环境

## 重要架构约束

### Prisma 客户端生成路径
- **Schema 位置：** 根目录 `prisma/schema.prisma`
- **生成目录：** `backend/node_modules/.prisma/client`（见 schema 中 `output` 配置）
- **导入路径：** 所有后端代码统一从 `backend/lib/prisma.ts` 导入单例客户端
- **注意事项：** 修改 schema 后必须运行 `bunx prisma generate` 并重启服务

### Vercel 部署配置
- **构建命令：** `npm install && npm run build && npm run prisma:generate`
- **输出目录：** `frontend/dist`（静态站点）
- **API 路由：** `api/` 目录下的 TypeScript 文件自动映射为 Serverless Functions
- **环境变量（必须在 Vercel 控制台配置）：**
  - `DATABASE_URL`: Neon PostgreSQL 连接字符串
  - `SYNC_SECRET`: 触发同步接口的密钥
  - `VITE_API_BASE_URL`: 前端 API 基础路径（部署时设为 `/api`）

### 代码注释与错误排查
- **中文注释规范：** 所有代码注释使用中文，专业术语保留英文并加注释
- **关键注意：** 如果在 `if` 语句或其他块中使用中文注释，**必须确保注释独占一行**，不要与代码写在同一行，否则 Bun 解析时可能报错（如 `Expected ";" but found ":"`）
  ```typescript
  // ✅ 正确
  if (filter.keyword) {
    // 关键词匹配标题、摘要和主题标签
    where.OR = [
      { title: { contains: filter.keyword } },
      // ...
    ];
  }

  // ❌ 错误（会导致 Bun 解析错误）
  if (filter.keyword) {
    where.OR = [ // 关键词匹配标题、摘要和主题标签
      { title: { contains: filter.keyword } },
    ];
  }
  ```

## 工作流程与最佳实践

### 本地开发流程
1. 确保已安装 Bun 和 Node.js
2. 复制 `.env.example` 为 `.env` 并填写数据库连接
3. 后端初始化：
   ```bash
   cd backend
   npm install
   bunx prisma generate --schema ../prisma/schema.prisma
   bunx prisma migrate deploy --schema ../prisma/schema.prisma
   ```
4. 启动后端服务：`bun run dev`（监听 3000 端口）
5. 新开终端启动前端：`cd frontend && npm run dev`（监听 5173 端口）
6. 如需测试数据抓取：`cd backend && bun run scripts/sync-runner.ts`

### 数据同步策略
- **手动触发：** 运行 `bun run scripts/sync-runner.ts`
- **API 触发：** `POST /api/sync` 携带 `{ "key": "your-secret" }`
- **自动定时：** GitHub Actions 每天自动运行（见 `docs/github-actions-setup.md`）

### 调试技巧
- **查看数据库：** `bunx prisma studio --schema ../prisma/schema.prisma`（启动可视化管理界面）
- **测试单个分类：** 修改 `sync-runner.ts` 中的 `CATEGORY_SEQUENCE` 数组
- **检查 API 响应：** 后端日志会输出所有请求，前端报错时优先查看 Network 面板

### 新增研报分类
1. 在 `backend/scripts/category-config.ts` 添加新分类配置（API URL、字段映射）
2. 更新 `prisma/schema.prisma` 中 `category` 字段的枚举（如需要）
3. 修改 `backend/scripts/sync-runner.ts` 的 `CATEGORY_SEQUENCE` 数组
4. 运行 `bunx prisma migrate dev` 生成并应用迁移
5. 更新前端筛选组件（`pages/ReportList.tsx`）添加新分类选项

## 常见问题排查

### Windows 环境 Bun 安装依赖失败（404 错误）
**解决方案：** 使用 `npm install` 替代 `bun install`

### 运行时报错 `Expected ";" but found ":"`
**原因：** 中文注释与代码写在同一行导致 Bun 解析错误
**解决方案：** 检查所有注释，确保独占一行

### Prisma 客户端找不到
**原因：** 未正确生成或路径错误
**解决方案：**
```bash
cd backend
bunx prisma generate --schema ../prisma/schema.prisma
```

### 前端无法调用后端 API
**检查项：**
1. `.env` 中 `VITE_API_BASE_URL` 配置正确
2. 后端服务已启动（`bun run dev`）
3. 前端 `import.meta.env.VITE_API_BASE_URL` 读取成功
4. 检查浏览器控制台 Network 面板查看请求 URL

### Vercel 部署后 API 500 错误
**检查项：**
1. Vercel 环境变量是否配置完整（`DATABASE_URL`、`SYNC_SECRET`）
2. Prisma 客户端是否在构建时生成（检查 `vercel.json` 的 `buildCommand`）
3. 查看 Vercel Function Logs 获取详细错误信息

## 相关文档

### 数据抓取相关
- **快速使用指南：** `docs/quick-start-sync.md` ⭐⭐⭐ 推荐先看
- **抓取机制详解：** `docs/sync-mechanism.md` - 深入理解抓取工作原理
- **优化记录：** `docs/optimization-done.md` - 已完成的性能优化总结
- **GitHub Actions 自动化：** `docs/github-actions-setup.md` - 每天自动抓取配置

### 其他文档
- **实施计划：** `docs/implementation-plan.md`
- **开发进度日志：** `docs/progress.md`
- **Serverless 超时调试：** `docs/serverless-timeout-debugging-guide.md`
- **PRD 文档：** `PRD.md`（可能存在编码问题，建议转 UTF-8）
