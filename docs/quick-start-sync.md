# 抓取脚本快速使用指南

## 🚀 最快上手（3 步）

### 第1步：编辑配置文件

打开项目根目录的 `.env` 文件（如果不存在，复制 `.env.example`）：

```env
# 最关键的两个配置
SYNC_LOOKBACK_DAYS=2        # 抓最近 2 天的数据
SYNC_CONCURRENCY=8          # 使用 8 个并发（优化后的默认值）
```

### 第2步：打开 PowerShell

```powershell
cd C:\Users\18805\Desktop\word\CC\investment-research-report\backend
```

### 第3步：运行脚本

```powershell
bun run scripts/sync-runner.ts
```

**完成！** 大约 3 分钟后会看到结果。

---

## 📋 配置参数说明

| 参数 | 含义 | 推荐值 | 范围 |
|------|------|--------|------|
| `SYNC_LOOKBACK_DAYS` | 抓取最近多少天的数据 | 2 | 1-90 |
| `SYNC_CONCURRENCY` | 同时发起多少个网络请求 | 8 | 4-12 |
| `SYNC_PAGE_SIZE` | 每页返回多少条数据 | 40 | 不建议改 |

---

## 🎯 常见使用场景

### 场景1：日常运行（只抓最近 2 天）

```powershell
cd backend
# 直接运行，使用 .env 中的配置
bun run scripts/sync-runner.ts
```

**预期：** ~3.2 分钟，抓取今天和昨天的全部报告

---

### 场景2：补历史数据（抓最近 30 天）

**方案A：修改 .env 后运行**
```env
SYNC_LOOKBACK_DAYS=30
```

**方案B：临时设置（不改 .env）**
```powershell
$env:SYNC_LOOKBACK_DAYS = "30"
cd backend
bun run scripts/sync-runner.ts
```

**预期：** ~8-10 分钟，抓取最近 30 天的全部报告

---

### 场景3：测试是否被限流

```powershell
$env:SYNC_CONCURRENCY = "6"  # 降低并发
cd backend
bun run scripts/sync-runner.ts
```

运行完看输出中的 `totalErrors`：
- < 5% → ✅ 没被限流
- > 10% → ⚠️ 被限流了，继续降低

---

### 场景4：尝试加速（增加并发）

```powershell
$env:SYNC_CONCURRENCY = "10"  # 试试能否更快
cd backend
bun run scripts/sync-runner.ts
```

观察是否有大量错误，如果有就改回 8。

---

## 📍 配置文件位置

你的项目里有这些相关文件：

```
investment-research-report/
├─ .env                          ← ⭐ 主配置文件（最常用）
├─ .env.example                  ← 配置模板
├─ .env.local                    ← 本地覆盖配置（可选）
├─ backend/
│  ├─ .env                       ← backend 专用配置（可选）
│  ├─ scripts/
│  │  └─ sync-runner.ts          ← 抓取脚本主文件
│  └─ package.json
└─ docs/
   └─ optimization-done.md       ← 详细优化文档
```

**推荐方案：** 只编辑项目根目录的 `.env` 文件，所有配置都写在里面。

---

## ⚙️ 配置方法对比

| 方法 | 难度 | 持久性 | 适用场景 |
|------|------|--------|---------|
| 编辑 `.env` | ⭐ 最简单 | ✅ 永久 | 日常使用 |
| PowerShell 临时设置 | ⭐ 简单 | ❌ 当次 | 一次性测试 |
| .env.local | ⭐⭐ 中等 | ✅ 永久 | 个人配置 |
| 系统环境变量 | ⭐⭐⭐ 复杂 | ✅ 永久 | 全局配置 |

---

## 🔍 查看运行结果

脚本运行完后，你会看到类似这样的输出：

```json
{
  "totalFetched": 450,
  "totalInserted": 200,
  "totalUpdated": 150,
  "totalErrors": 0,
  "categories": [
    {
      "category": "strategy",
      "fetched": 120,
      "inserted": 50,
      "updated": 40,
      "errors": 0
    },
    {
      "category": "macro",
      "fetched": 100,
      "inserted": 45,
      "updated": 35,
      "errors": 0
    },
    // ... 其他分类
  ]
}
```

**关键指标说明：**
- `totalFetched` = 从 API 拉到的总条数
- `totalInserted` = 新增数据条数
- `totalUpdated` = 更新数据条数
- `totalErrors` = 出错条数（应该接近 0）

**判断是否成功：**
- `totalErrors` 接近 0 → ✅ 成功
- `totalErrors` > totalFetched 的 10% → ⚠️ 可能有问题

---

## ⚡ 优化后的性能指标

| 项目 | 优化前 | 优化后 | 提升 |
|------|-------|-------|------|
| 并发数 | 4 | 8 | +100% |
| 详情页抓取 | 6.7 分钟 | 3.4 分钟 | -49% |
| 数据库查询 | 200 次 | 1 次 | -99% |
| 总耗时 | ~7 分钟 | ~3.2 分钟 | -54% |

---

## 🐛 常见问题排查

### Q: 运行时报错 "找不到 .env 文件"

A: 复制 `.env.example` 为 `.env`
```powershell
cd 项目根目录
Copy-Item .env.example .env
```

---

### Q: 设置了并发数但没生效

A: PowerShell 需要重启
```powershell
# 关闭当前 PowerShell，重新打开
# 重新设置
$env:SYNC_CONCURRENCY = "10"
```

---

### Q: 运行时出现大量 403/429 错误

A: 被限流了，降低并发数
```powershell
$env:SYNC_CONCURRENCY = "4"
bun run scripts/sync-runner.ts
```

---

### Q: 脚本运行中途想停止

A: 按 `Ctrl + C`（已入库的数据不会回滚）

---

### Q: 想看详细的抓取过程

A: 脚本会打印每个错误，看控制台输出即可。

---

## 📞 需要帮助？

- 详细的配置说明：查看 `docs/optimization-done.md`
- 抓取机制详解：查看 `docs/sync-mechanism.md`
- 中文代码注释：查看 `backend/scripts/sync-runner.ts`

