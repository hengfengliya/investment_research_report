# 📘 PRD：最全最专业的投研报告平台

## 一、项目概述

**项目目标：**  
构建一个可持续抓取东方财富网各类研报的系统，  
并通过现代化 Web 应用实现多维度筛选、搜索与展示。

**核心价值：**  
- 实时聚合券商研报数据；
- 一站式查看策略、行业、宏观与个股分析；
- 提供多层次筛选、关键词搜索与数据可视化能力；
- 支持自动更新与云端部署，全流程免费。

---

## 二、总体架构

| 模块 | 技术栈 | 部署平台 |
|------|---------|----------|
| 前端 | Vite + React + TailwindCSS | Vercel |
| 后端 | Hono + Bun + Prisma | Vercel Functions |
| 数据库 | PostgreSQL | Neon.tech |
| 爬虫 | Node（Bun）+ Cheerio + Axios | 本地或计划任务执行 |

---

## 三、功能需求

### 3.1 数据采集模块（爬虫）

#### 📍 数据来源
| 类型 | 地址 |
|------|------|
| 策略报告 | https://data.eastmoney.com/report/strategy.jshtml |
| 行业研报 | https://data.eastmoney.com/report/industry.jshtml |
| 宏观研报 | https://data.eastmoney.com/report/macro.jshtml |
| 个股研报 | https://data.eastmoney.com/report/stock.jshtml |

#### 📍 抓取逻辑
- 定期执行（每日或每 3 小时）
- 解析每条研报详情页，提取主要字段；
- 新增数据写入数据库；
- 已存在记录根据 `title + date + org` 去重。

#### 📍 字段定义

##### 通用字段（所有类型）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| `id` | Int / UUID | 主键 |
| `title` | String | 研报标题 |
| `category` | Enum(`strategy`, `industry`, `macro`, `stock`) | 研报类型 |
| `org` | String | 发布机构 |
| `author` | String | 作者（多个作者以`,`分隔） |
| `date` | DateTime | 发布时间 |
| `summary` | String | 研报摘要或概述 |
| `pdfUrl` | String | PDF下载地址 |
| `sourceUrl` | String | 原网页地址 |
| `createdAt` | DateTime | 入库时间 |

##### 扩展字段（部分类型适用）
| 字段名 | 类型 | 适用类型 | 说明 |
|--------|------|-----------|------|
| `stockCode` | String | stock | 股票代码 |
| `stockName` | String | stock | 股票名称 |
| `industry` | String | industry / stock | 所属行业 |
| `rating` | String | stock | 投资评级 |
| `ratingChange` | String | stock | 评级变化 |
| `targetPrice` | Float | stock | 目标价 |
| `changePercent` | Float | stock | 涨跌预期 |
| `topicTags` | String[] | all | 自动提取关键词 |
| `impactLevel` | Enum(`high`,`medium`,`low`) | strategy / macro | 影响程度 |
| `dataSource` | String | all | 默认 EastMoney |

---

### 3.2 数据存储模块

**数据库：** PostgreSQL (Neon Serverless)  
**ORM：** Prisma

```prisma
model Report {
  id            Int       @id @default(autoincrement())
  title         String
  category      String
  org           String?
  author        String?
  date          DateTime
  summary       String?
  pdfUrl        String?
  sourceUrl     String
  stockCode     String?
  stockName     String?
  industry      String?
  rating        String?
  ratingChange  String?
  targetPrice   Float?
  changePercent Float?
  topicTags     String[]  @default([])
  impactLevel   String?
  dataSource    String?   @default("EastMoney")
  createdAt     DateTime  @default(now())
}
```

---

### 3.3 后端服务（API）

**框架：** Hono + Bun + Prisma  
**部署：** Vercel Serverless Functions  

#### 📍 API 路由设计

| 方法 | 路径 | 功能 | 参数示例 |
|------|------|------|----------|
| `GET` | `/api/reports` | 获取研报列表 | `?page=1&pageSize=20&category=stock&keyword=新能源` |
| `GET` | `/api/report/:id` | 获取研报详情 | - |
| `POST` | `/api/sync` | 触发研报同步任务 | （仅管理员） |
| `GET` | `/api/categories` | 获取研报分类统计 | - |

#### 📍 功能要求
- 支持分页、模糊搜索、分类筛选；
- 可按时间或热度排序；
- 结果缓存（Vercel Edge Cache 或 Redis 可选）；
- 异常日志写入（console + Sentry 可选）。

---

### 3.4 前端展示模块

**技术栈：** React + Vite + TailwindCSS  
**部署：** Vercel

#### 📍 页面结构
| 页面 | 功能 |
|------|------|
| 首页 | 展示最新研报、按类别入口 |
| 列表页 | 多条件筛选与搜索 |
| 详情页 | 显示研报信息与下载链接 |
| 关于页 | 项目介绍与数据来源说明 |

#### 📍 筛选功能
- 研报类型：策略 / 行业 / 宏观 / 个股  
- 发布机构  
- 时间范围（近7日 / 近30日 / 自定义）  
- 行业或板块  
- 作者  
- 投资评级（个股类）  
- 关键词搜索  

#### 📍 UI 要求
- 响应式设计，支持移动端；
- 分页加载；
- Tailwind 统一主题；
- 点击跳转详情或原文；
- 支持中英文界面切换（可选）。

---

## 四、系统部署方案

### 4.1 Vercel 前端部署
- 部署分支：`main`
- 框架：`Vite`
- 输出目录：`/dist`
- 环境变量：
  ```
  VITE_API_BASE_URL=https://<your-vercel-backend>.vercel.app/api
  ```

### 4.2 Vercel 后端部署
- 目录结构：
  ```
  /api
    ├── reports.ts
    ├── report/[id].ts
    ├── sync.ts
  ```
- 环境变量：
  ```
  DATABASE_URL=postgresql://<user>:<password>@<neon-host>/<db>?sslmode=require
  ```

### 4.3 Neon 数据库
- 创建 PostgreSQL 实例；
- 获取连接字符串；
- 配置入 `.env`；
- 迁移命令：
  ```bash
  bunx prisma migrate deploy
  ```

---

## 五、后续扩展规划

| 功能 | 优先级 | 描述 |
|------|----------|------|
| PDF 预览与在线阅读 | ★★★ | 支持内嵌 PDF Reader |
| 收藏与热度排行 | ★★☆ | 用户行为统计 |
| RSS / Webhook 推送 | ★★☆ | 自动推送新研报至钉钉 / 飞书 |
| 研报摘要 AI 精读 | ★☆☆ | 用 GPT 自动生成摘要与要点 |
| 用户权限与后台管理 | ★☆☆ | 管理员可编辑与删除研报 |

---

## 六、项目目录结构建议
```
eastmoney-research-hub/
├── frontend/          
│   ├── src/
│   ├── public/
│   └── vite.config.ts
├── backend/           
│   ├── api/
│   ├── prisma/
│   └── scripts/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── .env.example
├── README.md
└── PRD.md
```

---

## 七、验收标准
- ✅ 每日自动更新研报数据；
- ✅ 前端展示四类研报且筛选正常；
- ✅ 后端接口响应 < 500ms；
- ✅ Neon 数据一致性与日志稳定；
- ✅ 可一键 Vercel 部署，无需服务器。

---
## 八、相关配置
- Neon（PostgreSQL）连接字符串：psql 'postgresql://neondb_owner:npg_me91zWbTBDpj@ep-steep-unit-adwx68g1-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
- git项目地址：https://github.com/hengfengliya/investment_research_report
- VERCEL_TOKE：ywm2iAn0hOP1Nrwvtr58tRuk

**版本号：** v1.0  
**作者：** ChatGPT x 投资项目组  
**更新时间：** 2025-10-28
