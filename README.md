# 东方财富研报聚合系统（MVP）

本项目按照 PRD 要求搭建，包含数据抓取（Bun + Prisma）、后端 API（Hono）、前端展示（Vite + React + TailwindCSS）三大模块，支持东方财富四类研报的聚合、筛选、搜索与详情查看。

## 目录结构

```
.
├── backend/            # Hono 接口、Prisma 客户端与同步脚本
├── frontend/           # Vite + React 前端工程
├── prisma/             # Prisma schema 及后续迁移目录
├── docs/               # 规划文档
├── .env.example        # 环境变量示例
└── PRD.md              # 原始 PRD（存在编码乱码，可另存为 UTF-8）
```

## 快速开始

### 1. 准备环境
1. 安装 [Bun](https://bun.sh)（用于后端与脚本）。
2. 安装 Node.js / pnpm / npm（用于前端）。
3. 准备 Neon PostgreSQL 数据库，并在 `.env` 中填写 `DATABASE_URL`。

### 2. 配置环境变量
复制 `.env.example` 为 `.env`，根据实际情况填写：

```bash
cp .env.example .env
```

- `DATABASE_URL`：Neon 提供的 Postgres 连接字符串。
- `SYNC_SECRET`：触发同步接口的自定义密钥。
- `VITE_API_BASE_URL`：前端访问的后端地址（本地开发可设为 `http://localhost:3000/api`）。

### 3. 数据库迁移

```bash
cd backend
bun install
bunx prisma generate
bunx prisma migrate deploy
```

### 4. 运行爬虫

```bash
cd backend
bun run scripts/sync-runner.ts
```

执行完成后会输出插入/更新统计。

### 5. 启动后端

```bash
cd backend
bun run dev
```

默认以 Hono 形式运行，可迁移至 Vercel Serverless Functions。`/api/sync` 接口需要 `SYNC_SECRET`。

### 6. 启动前端

```bash
cd frontend
npm install
npm run dev
```

打开 `http://localhost:5173` 即可查看研报筛选与详情页面。

## 关键功能

- **数据抓取脚本**：调用东方财富 `report/list`、`report/jg` 接口，解析 JSONP 数据与详情页，并写入 Prisma `Report` 表。
- **后端 API**：
  - `GET /api/reports`：分页 + 筛选 + 关键词。
  - `GET /api/report/:id`：研报详情。
  - `GET /api/categories`：分类统计。
  - `POST /api/sync`：携带密钥触发抓取。
- **前端界面**：
  - Tailwind 设计的筛选表单、列表卡片、分类统计。
  - 详情页展示摘要、评级、标签、PDF 下载。
  - 响应式布局，兼容移动端。

## 后续优化建议

- 新增缓存层（如 Vercel Edge、Redis）提升接口响应与抗压能力。
- 抓取任务可迁移至定时器（GitHub Actions/Cloud Scheduler），并利用队列降低突发压力。
- 摘要与标签目前基于原文提取，可结合 LLM 优化语义质量。
- 原始 PRD 存在编码问题，建议整理为 UTF-8 版本便于协作。

如需进一步扩展（收藏、热度排行、AI 摘要、权限管理等），欢迎继续沟通。*** End Patch
