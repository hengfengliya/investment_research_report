# 技术栈经验文档

> 本文档总结了在 **东方财富研报聚合系统** 项目中积累的技术选型、架构设计、开发流程和 AI 编码最佳实践经验。目的是为后续项目的复用和快速迭代提供参考。

**项目特点：** Monorepo 结构 + Serverless 部署 + 数据爬取 + AI 辅助编码

---

## 1. 技术栈总览

### 1.1 核心技术选择

| 层级 | 技术 | 版本 | 选择原因 |
|------|------|------|---------|
| **运行时** | Bun + Node.js | Bun latest | Bun 速度快、兼容 CommonJS/ESM；部署时用 Node 保证兼容性 |
| **后端框架** | Hono | ^4.5.3 | 轻量级、Serverless 友好、TypeScript 原生支持 |
| **前端框架** | React | ^18.3.1 | 生态成熟、组件库丰富、AI 生成代码质量好 |
| **前端构建** | Vite | ^5.4.8 | 启动快、开发体验好、Rollup 打包稳定 |
| **样式方案** | TailwindCSS | ^3.4.15 | 原子化 CSS、减少自定义 CSS、AI 生成效率高 |
| **ORM** | Prisma | ^5.20.0 | 类型安全、迁移管理强大、适合快速原型 |
| **数据库** | PostgreSQL (Neon) | - | 云 Serverless 版、无维护、按使用量付费 |
| **HTTP 客户端** | Axios | ^1.7.7 | 适合爬虫、请求/响应拦截、错误处理完善 |
| **HTML 解析** | Cheerio | ^1.0.0-rc.12 | 轻量级、jQuery API 易上手、抓取数据快 |
| **并发控制** | p-limit | ^5.0.0 | 控制并发数、防止被限流、简单易用 |
| **参数验证** | Zod | ^3.23.8 | TypeScript 原生、运行时校验、错误信息清晰 |
| **部署平台** | Vercel | - | 无服务器、自动部署、原生 Node.js 支持 |

### 1.2 项目结构

```
investment-research-report/          # monorepo 根目录
├── backend/                         # 后端 Bun 项目
│   ├── server.ts                   # 本地开发 HTTP 服务器（Hono）
│   ├── services/                   # 业务逻辑服务
│   │   └── report-service.ts       # 研报查询服务（分页、筛选）
│   ├── scripts/                    # 数据抓取脚本
│   │   ├── sync-runner.ts          # 主抓取协调器（并发、重试）
│   │   ├── fetch-list.ts           # 列表页抓取（JSONP 解析）
│   │   ├── detail-parser.ts        # 详情页解析（Cheerio）
│   │   ├── task-2025-full-year.ts  # 全年数据批量抓取任务
│   │   └── category-config.ts      # 分类配置（URL、字段映射）
│   ├── lib/
│   │   ├── prisma.ts               # Prisma 客户端单例
│   │   └── validators.ts           # Zod schema 定义
│   └── package.json                # Bun 依赖
├── frontend/                        # 前端 React 项目
│   ├── src/
│   │   ├── App.tsx                 # 路由根组件
│   │   ├── pages/                  # 页面组件
│   │   │   ├── ReportList.tsx      # 列表页（筛选、搜索、分页）
│   │   │   ├── ReportDetail.tsx    # 详情页
│   │   │   └── About.tsx           # 关于页面
│   │   ├── components/             # 可复用组件（Radix UI + TailwindCSS）
│   │   └── types/                  # TypeScript 类型定义
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json                # npm 依赖
├── api/                            # Vercel Serverless Functions
│   ├── reports.ts                  # GET /api/reports（列表）
│   ├── categories.ts               # GET /api/categories（分类统计）
│   ├── report/[id].ts              # GET /api/report/:id（详情）
│   ├── sync.ts                     # POST /api/sync（触发同步）
│   └── health.ts                   # GET /api/health（健康检查）
├── prisma/
│   └── schema.prisma               # Prisma 数据模型（Report 表）
├── .github/workflows/
│   ├── daily-sync.yml              # 每天 22:00 UTC 自动抓取
│   └── run-2025.yml                # 手动触发全年抓取
├── package.json                    # monorepo root（npm workspaces）
├── tsconfig.json                   # 全局 TypeScript 配置
└── vercel.json                     # Vercel 部署配置

**关键特点：**
- **Monorepo 管理：** npm workspaces，统一 Prisma 生成路径
- **双端口开发：** 后端 3000（Bun HTTP）+ 前端 5173（Vite Dev Server）
- **Serverless 优化：** api/ 目录下的函数自动映射为 Vercel Functions
```

---

## 2. 架构设计核心

### 2.1 后端架构：Hono + Prisma

```
请求入口（API 路由）
    ↓
参数校验（Zod schema）
    ↓
业务服务层（report-service.ts）
    ├→ 构建 Prisma WHERE 条件
    ├→ 处理排序/分页逻辑
    └→ 执行数据库查询
    ↓
JSON 响应
```

**关键文件：**
- `backend/server.ts`：本地开发用 Hono 服务器，CORS 跨域配置
- `backend/services/report-service.ts`：**核心查询逻辑**
  - `listReports()`：支持 10 种筛选维度（分类、机构、作者、行业、评级、关键词、日期范围等）
  - `getReportById()`：单条查询
  - `getCategoryStats()`：分类聚合统计
- `api/reports.ts`：Vercel Serverless 版本（使用 Neon SQL 直连，绕过 Prisma 超时问题）

**数据库模型（Prisma）：**
```prisma
model Report {
  id              Int      @id @default(autoincrement())
  title           String
  category        String   // "strategy" | "macro" | "industry" | "stock"
  org             String?  // 发布机构
  author          String?  // 作者
  date            DateTime // 发布时间
  summary         String?  // 摘要
  pdfUrl          String?  // PDF 链接
  sourceUrl       String   // 原文链接
  topicTags       String[] @default([])  // 主题标签数组
  rating          String?  // 投资评级（个股）
  ratingChange    String?  // 评级变化
  targetPrice     Float?   // 目标价格
  changePercent   Float?   // 涨跌预期
  impactLevel     String?  // 影响程度（策略/宏观）
  dataSource      String?  @default("EastMoney")
  createdAt       DateTime @default(now())

  @@unique([title, date, org])  // 防重复
  @@index([category])
  @@index([date])
  @@index([org])
  @@index([author])
}
```

### 2.2 前端架构：React + Router + TailwindCSS

```
App.tsx（路由根）
├→ ReportList 页面
│   ├→ SearchBar 组件
│   ├→ SidebarFilter 组件（筛选面板）
│   ├→ ReportCard 卡片列表（无限滚动/分页）
│   └→ 状态管理（useState hooks）
├→ ReportDetail 页面
│   └→ 详情展示（PDF 嵌入、外链跳转）
└→ About 页面

样式方案：
TailwindCSS + 自定义颜色变量（brand-primary/secondary）
+ Radix UI 无头组件（Dialog、Dropdown、Select）
```

**关键特点：**
- 无 Redux/Zustand：仅用 React Hooks 管理状态（筛选条件、分页、搜索关键词）
- 无 Query 库：直接用 fetch/axios 调用 API，手动管理加载状态
- 环境变量切换：`import.meta.env.VITE_API_BASE_URL` 在开发/生产环境自动切换

### 2.3 数据同步流程

**两种同步方式：**

**方式 1：定时同步（GitHub Actions）**
```
每天 22:00 UTC（北京时间 06:00）
    ↓
检出代码 → 安装 Bun → npm install → 生成 Prisma
    ↓
运行 sync-runner.ts
    ↓
遍历 4 个分类（strategy → macro → industry → stock）
    ↓
每个分类：
  1. 调用 fetchCategoryList() 获取列表页 JSONP 数据
  2. 提取 10-100 条记录（受 SYNC_LOOKBACK_DAYS 限制）
  3. 用 p-limit 控制并发（6-8 并发，防止被限流）
  4. 逐条调用 fetchDetailInfo() 爬取详情页
  5. 用 Cheerio 解析 HTML，提取摘要、PDF、标签
  6. Prisma upsert 去重入库
```

**方式 2：手动触发**
- 本地：`cd backend && npm run task:2025`（抓取全年数据）
- API：`POST /api/sync?key=SYNC_SECRET`

**关键优化：**
- `SYNC_LOOKBACK_DAYS=2`：只抓最近 2 天，加快速度
- `SYNC_CONCURRENCY=6-8`：平衡速度与被限流风险
- Prisma `upsert`：自动去重（唯一约束 `[title, date, org]`）
- 数据正规化：作者、标签、机构名称处理

---

## 3. GitHub Actions 自动化实践

### 3.1 两个工作流配置

**工作流 1：daily-sync.yml（每日定时）**
```yaml
name: Daily Sync Research Reports

on:
  schedule:
    - cron: '0 22 * * *'  # 每天 22:00 UTC（北京时间 06:00）
  workflow_dispatch:       # 支持手动触发

jobs:
  sync:
    runs-on: ubuntu-latest
    environment:
      name: production    # 引用 GitHub 环境的变量/Secrets
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Inject runtime env
        shell: bash
        run: |
          echo "DATABASE_URL=${{ vars.DATABASE_URL || secrets.DATABASE_URL }}" >> $GITHUB_ENV
          echo "SYNC_LOOKBACK_DAYS=${{ vars.SYNC_LOOKBACK_DAYS || 2 }}" >> $GITHUB_ENV
          echo "SYNC_CONCURRENCY=${{ vars.SYNC_CONCURRENCY || 8 }}" >> $GITHUB_ENV

      - name: Install dependencies
        run: |
          cd backend
          npm install

      - name: Generate Prisma client
        run: |
          cd backend
          npx prisma generate --schema ../prisma/schema.prisma

      - name: Run sync script
        run: |
          cd backend
          bun run scripts/sync-runner.ts
```

**工作流 2：run-2025.yml（全年抓取）**
```yaml
# 几乎相同，只是运行 npm run task:2025（抓取整年数据）
# 用于初始化或补数据
```

### 3.2 GitHub Actions 最佳实践

| 实践项 | 说明 |
|--------|------|
| **环境变量管理** | 用 `vars.*` 读 Repository Variables（动态调整），用 `secrets.*` 读 Secrets（敏感信息）；支持 fallback `\|\|` |
| **时区处理** | Cron 表达式用 UTC：北京时间 06:00 = UTC 22:00（06:00 - 8 = -02:00 前一天 22:00） |
| **Bun 集成** | `oven-sh/setup-bun@v1` 自动安装，速度快；backend 依赖用 npm install（Windows 兼容性更好） |
| **错误处理** | `if: failure()` 步骤仅在前置步骤失败时运行；可集成 Slack/钉钉通知 |
| **日志输出** | 每个步骤明确说明用途，方便 GitHub Actions 日志查询调试 |
| **成本控制** | 定时任务避免高峰时段；并发数、页大小可调，防止超时或被限流 |

### 3.3 配置 GitHub Actions 环境

**步骤 1：创建 Repository Variables**
```
Settings → Environments → production
添加以下变量：
- DATABASE_URL: neon://...（Neon PostgreSQL 连接字符串）
- SYNC_LOOKBACK_DAYS: 2（默认回溯天数）
- SYNC_CONCURRENCY: 8（并发数）
- SYNC_PAGE_SIZE: 40（每页条数）
```

**步骤 2：创建 Repository Secrets**
```
Settings → Secrets and variables → Actions
- 无需添加敏感 Secrets（DATABASE_URL 可以放 Variables，非密钥）
```

**步骤 3：手动触发工作流**
```
GitHub 网页 → Actions 选项卡
→ 选择工作流 → Run workflow
→ 选择分支（main）→ 执行
```

---

## 4. Vercel 部署流程

### 4.1 部署配置

**vercel.json 关键配置：**
```json
{
  "version": 2,
  "framework": "vite",
  "outputDirectory": "frontend/dist",
  "functions": {
    "api/**/*.ts": {
      "includeFiles": "backend/dist/**"
    }
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**package.json 构建脚本：**
```json
{
  "scripts": {
    "vercel-build": "npx prisma generate --schema prisma/schema.prisma && npm run build --workspace backend && npm run build --workspace frontend"
  }
}
```

### 4.2 部署环境变量（Vercel 控制台）

```
Settings → Environment Variables
- DATABASE_URL: neon://...
- SYNC_SECRET: 触发同步接口的密钥
- VITE_API_BASE_URL: /api（生产环境）
- NODE_VERSION: 20（指定 Node 版本）
```

### 4.3 部署流程

```
1. 推送代码到 main 分支
2. Vercel 自动触发构建
3. 执行构建命令：vercel-build
   ├→ 生成 Prisma 客户端
   ├→ 打包后端（TypeScript → JavaScript）
   └→ 打包前端（Vite build）
4. 部署静态文件（frontend/dist）到 CDN
5. 部署 Serverless 函数（api/ 目录）
6. 自动分配 HTTPS 域名 + 自签证书
```

---

## 5. Vibe Code 中使用 AI 辅助编码的经验

### 5.1 效果最好的场景

| 场景 | 适用度 | 建议 |
|------|--------|------|
| **CRUD 业务逻辑** | ⭐⭐⭐⭐⭐ | 直接让 AI 生成服务层、API 路由、React 页面 |
| **数据爬虫脚本** | ⭐⭐⭐⭐ | 提供网页结构，AI 生成 Cheerio 解析逻辑 |
| **组件库集成** | ⭐⭐⭐⭐⭐ | Radix UI + TailwindCSS，AI 生成高质量代码 |
| **类型定义** | ⭐⭐⭐⭐⭐ | AI 自动推导 Prisma/API 类型，减少手写 |
| **样式调整** | ⭐⭐⭐⭐ | TailwindCSS 原子类名，AI 快速调整布局 |
| **错误处理** | ⭐⭐⭐ | AI 容易遗漏边界情况，需手工补充 |
| **性能优化** | ⭐⭐ | AI 不擅长，需专业知识指导 |
| **架构设计** | ⭐ | AI 倾向简单方案，复杂系统需人工规划 |

### 5.2 高效 Prompt 工程实践

**模板 1：生成新 API 路由**
```
我需要创建一个 GET /api/reports 接口，用于查询研报列表。
要求：
1. 支持分页（page、pageSize）和筛选（category、org、keyword）
2. 使用 Prisma 查询数据库
3. 返回格式：{ success: true, data: { items, total, totalPages } }
4. 错误处理完整，使用 Zod 校验参数
5. 代码文件不超过 150 行

请参考现有的 backend/services/report-service.ts 的实现风格
```

**模板 2：扩展 React 组件**
```
我已有一个 ReportCard 卡片组件，现在要添加新功能：
1. 添加 "收藏" 功能（toggleable 星标按钮）
2. 右上角显示 "分享" 菜单（使用 Radix UI Dropdown）
3. 改进样式，确保卡片在移动端也好看
4. 使用 TailwindCSS，颜色使用已定义的 brand-primary

不改变 Props 接口，仅增强 UI/交互
```

**模板 3：调试数据问题**
```
后端 sync-runner.ts 抓取数据后，发现部分研报的 summary 字段为空。
我想在爬虫脚本中添加日志和备用解析逻辑：
1. 如果 summary 为空，尝试从 <meta name="description"> 抓取
2. 如果仍为空，使用 title 的前 100 字
3. 记录详细日志（URL、字段来源）

请更新 backend/scripts/detail-parser.ts
```

### 5.3 代码审查与质量控制

**AI 生成代码的常见问题：**

| 问题 | 表现 | 解决方案 |
|------|------|---------|
| **中文注释导致 Bun 解析错误** | `Expected ";" but found ":"` | 确保注释独占一行，不与代码同行 |
| **类型定义不完整** | TypeScript 编译报错 | 主动要求 AI 导出所有类型定义，补充 `as const` 字面量类型 |
| **边界情况处理缺失** | 数值为 null/undefined 时出错 | 让 AI 补充 null check、try-catch、默认值 |
| **Prisma 查询效率低** | N+1 问题、未创建索引 | 审查 `select` 字段、`include` 关系、索引配置 |
| **React 渲染性能** | 每次重渲染都请求 API | 加入 `useEffect` 依赖数组、`useMemo`、`useCallback` |
| **错误信息不清晰** | 用户看不懂为什么请求失败 | 让 AI 补充详细的错误码、错误描述 |

**代码审查清单：**
```
□ 中文注释是否独占一行？
□ 所有 API 返回值是否有 TypeScript 类型？
□ 是否处理了 null/undefined 情况？
□ 数据库查询是否有索引支持？
□ React 组件是否有 useEffect 依赖数组？
□ 错误捕获是否完整（try-catch、error boundaries）？
□ 环境变量是否从 .env 读取？
□ 单个文件是否超过 200 行？
□ 循环依赖是否存在？
□ 是否有明显的代码冗余？
```

### 5.4 与 Claude Code 的协作流程

```
第 1 步：项目规划
  ├→ 在 CLAUDE.md 中写清楚项目概述、架构、常用命令
  └→ 说明技术栈选择、禁止事项（不要修改 schema 未经讨论）

第 2 步：功能开发
  ├→ 向 AI 提供：现有代码示例、数据结构、API 文档
  ├→ 要求 AI：生成新功能代码、附带 TypeScript 类型
  └→ 自己审查：复制粘贴前，检查上述清单

第 3 步：测试 & 调试
  ├→ 本地运行（后端 3000、前端 5173）
  ├→ 测试异常情况（空值、网络超时、并发请求）
  └→ 查看 GitHub Actions 日志，验证自动化流程

第 4 步：部署
  ├→ 推送到 main（自动触发 Vercel 部署）
  ├→ 检查 Vercel Functions 日志
  └→ 如有异常，回滚或快速修复
```

---

## 6. Windows 开发环境配置

### 6.1 必备工具

```bash
# 1. Node.js 20.x
node --version  # v20.x

# 2. Bun（本地开发快速构建）
bun --version

# 3. Git
git --version

# 4. npm 或 yarn
npm --version
```

### 6.2 项目初始化

```bash
# 克隆仓库
git clone https://github.com/your-username/investment-research-report.git
cd investment-research-report

# 复制环境变量
cp .env.example .env
# 编辑 .env，填入 DATABASE_URL（Neon PostgreSQL）

# 安装依赖（Windows 推荐用 npm，Bun 有 404 问题）
npm install

# 后端初始化
cd backend
npm install
npx prisma generate --schema ../prisma/schema.prisma
npx prisma migrate deploy --schema ../prisma/schema.prisma

# 前端初始化
cd ../frontend
npm install

# 回到根目录
cd ..
```

### 6.3 本地开发启动

**终端 1：启动后端**
```bash
cd backend
bun run dev
# 输出：Server is running on port 3000
```

**终端 2：启动前端**
```bash
cd frontend
npm run dev
# 输出：VITE v5.x.x  ready in xxx ms
# ➜  Local:   http://localhost:5173/
```

**访问：** http://localhost:5173/

### 6.4 常见问题排查

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| `Prisma 客户端找不到` | 未生成或路径错误 | `npx prisma generate --schema ../prisma/schema.prisma` |
| `npm install 卡住（Windows）` | Bun 或依赖下载超时 | 使用 `npm install` 替代 `bun install` |
| `Expected ";" but found ":"` | 中文注释与代码同行 | 检查注释，确保独占一行 |
| `前端无法调用后端 API` | 环境变量或 CORS 错误 | 检查 `VITE_API_BASE_URL`、后端 CORS 配置 |
| `数据库连接失败` | DATABASE_URL 不对 | 检查 `.env`、确保 Neon 账户可访问 |

---

## 7. 代码组织最佳实践

### 7.1 文件大小约束（CLAUDE.md 要求）

```
TypeScript/JavaScript：不超过 200 行/文件
目录：不超过 8 个文件/目录，否则分层
```

**示例：正确的后端拆分**
```
backend/
├── services/
│   ├── report-service.ts         # 查询逻辑（~100 行）
│   └── sync-service.ts           # 同步逻辑（拆分到 scripts/）
├── scripts/
│   ├── sync-runner.ts            # 主协调器（~150 行）
│   ├── fetch-list.ts             # 列表页爬虫（~100 行）
│   ├── detail-parser.ts          # 详情页解析（~150 行）
│   └── task-2025-full-year.ts    # 全年任务（~150 行）
├── lib/
│   ├── prisma.ts                 # Prisma 单例
│   └── validators.ts             # Zod schema（~50 行）
└── types/
    └── report.ts                 # 类型定义（~30 行）
```

### 7.2 避免「代码坏味道」

| 坏味道 | 表现 | 改进 |
|--------|------|------|
| **僵化** | 修改一个字段，3 个地方要改 | 用 Prisma schema 单一源、类型定义共享 |
| **冗余** | 相同查询逻辑重复写 3 次 | 提取到 service 层、组件库统一 |
| **循环依赖** | A 导入 B、B 导入 A | 创建中间层 lib、厘清依赖方向 |
| **脆弱** | 改 API 字段，前端闪退 | 严格 TypeScript、前端兼容旧字段 |
| **晦涩** | 看代码 5 分钟还不懂在干啥 | 添加中文注释、变量名语义化 |
| **数据泥团** | { page, pageSize, sort, category } 到处传 | 定义 `interface ReportFilter`，统一接口 |
| **不必要复杂** | 用 Redux 管理 3 个组件状态 | useState + Context 足够，不过度设计 |

---

## 8. 快速参考清单

### 8.1 日常开发流程

```bash
# 1. 从最新 main 更新代码
git checkout main
git pull origin main

# 2. 创建功能分支
git checkout -b feat/new-feature

# 3. 启动本地开发（两个终端）
# 终端 1
cd backend && bun run dev

# 终端 2
cd frontend && npm run dev

# 4. 修改代码 + 测试

# 5. Lint 检查（可选）
cd backend && bunx biome check .

# 6. 提交代码
git add .
git commit -m "feat: add new feature"

# 7. 推送并创建 Pull Request
git push origin feat/new-feature
# → GitHub 创建 PR，等待 Review

# 8. Merge 后，自动部署到 Vercel
```

### 8.2 常用 npm 命令

```bash
# 根目录
npm run build              # 构建前端
npm run prisma:generate   # 生成 Prisma 客户端

# 后端 backend/
npm run dev               # 本地开发（Bun watch）
npm run task:2025         # 抓取 2025 全年数据
npm run build             # TypeScript 编译
npm run lint              # Biome 检查

# 前端 frontend/
npm run dev               # Vite 开发服务器
npm run build             # 生产构建
npm run preview           # 预览构建结果
```

### 8.3 Prisma 常用命令

```bash
cd backend

# 查看数据库
npx prisma studio --schema ../prisma/schema.prisma

# 生成 Prisma 客户端
npx prisma generate --schema ../prisma/schema.prisma

# 运行迁移
npx prisma migrate deploy --schema ../prisma/schema.prisma

# 创建新迁移
npx prisma migrate dev --name add_new_field --schema ../prisma/schema.prisma
```

### 8.4 GitHub Actions 触发

```bash
# 方式 1：GitHub 网页手动触发
Settings → Actions → 选择工作流 → Run workflow

# 方式 2：通过 gh CLI
gh workflow run daily-sync.yml -r main

# 方式 3：推送代码，触发定时任务
# daily-sync.yml 每天 22:00 UTC 自动运行
```

---

## 9. 总结与建议

### 9.1 项目成功要点

✅ **技术选型合理：** Bun + Hono + Prisma 轻量级组合，快速原型开发
✅ **架构清晰：** 后端 service 层隔离，前端 hooks 状态管理，易维护
✅ **自动化完善：** GitHub Actions 每日定时同步，Vercel 自动部署
✅ **类型安全：** TypeScript + Prisma + Zod，减少运行时错误
✅ **文档齐全：** CLAUDE.md 和注释清晰，AI 上手快

### 9.2 下个项目复用建议

**快速启动模板：**
```bash
# 1. 复制 monorepo 结构
cp -r investment-research-report new-project

# 2. 更新 package.json 名称
# 3. 清空 prisma schema，定义新模型
# 4. 清空 src/ 前端代码
# 5. 清空 backend/scripts/ 爬虫脚本
# 6. 运行 npm install && npm run prisma:generate
# 7. 开始新项目开发
```

**复用的部分：**
- ✅ Vercel 部署配置（vercel.json）
- ✅ GitHub Actions 工作流（.github/workflows/）
- ✅ Prisma 初始化（schema 结构、类型生成）
- ✅ 后端 API 模板（Hono + Zod 校验）
- ✅ 前端 UI 框架（Radix UI + TailwindCSS）
- ✅ 开发环境配置（tsconfig、Vite、ESM）

**需要重新设计的部分：**
- ❌ 业务逻辑（service 层）
- ❌ 数据模型（Prisma schema）
- ❌ 页面组件（React 页面）
- ❌ 爬虫脚本（数据源不同）

### 9.3 与 AI 协作的长期策略

1. **建立 CLAUDE.md 规范：** 每个项目都配置清晰的 CLAUDE.md，说明架构、约束、禁止事项
2. **积累 Prompt 库：** 记录有效的 Prompt 模板，持续优化
3. **自动化代码审查：** 用 Biome/ESLint 自动检查，减少手工 Review 成本
4. **版本控制记录：** commit message 记录 AI 代码的改动，便于追溯问题根源
5. **定期代码重构：** 每周审视代码质量，及时消除"坏味道"

---

## 附录：参考链接

- **Hono 官方文档：** https://hono.dev/
- **Prisma 官方文档：** https://www.prisma.io/docs/
- **React 官方文档：** https://react.dev/
- **TailwindCSS 官方文档：** https://tailwindcss.com/docs/
- **Radix UI 文档：** https://www.radix-ui.com/docs/
- **Vercel 部署指南：** https://vercel.com/docs/
- **GitHub Actions 文档：** https://docs.github.com/en/actions/
- **Zod 验证库：** https://zod.dev/
- **Bun 官方文档：** https://bun.sh/docs/

---

**最后更新：** 2025-10-31
**作者：** AI + 开发者
**许可证：** MIT

