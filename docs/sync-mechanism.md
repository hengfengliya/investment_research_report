# 研报抓取机制详解

## 目录
1. [运行方式](#运行方式)
2. [脚本执行流程](#脚本执行流程)
3. [核心运行机制](#核心运行机制)
4. [性能分析](#性能分析)
5. [优化建议](#优化建议)

---

## 运行方式

### 方式1：本地直接执行（一次性）
```bash
cd backend
bun run scripts/sync-runner.ts
```

**流程：**
1. Bun 读取 TypeScript 文件
2. 直接执行（无需编译，Bun 原生支持 TS）
3. 脚本开始从 `sync-runner.ts` 的第 164-171 行入口执行
4. 运行完毕，进程退出

### 方式2：API 触发（远程调用）
```bash
POST /api/sync
Content-Type: application/json
{ "key": "your-secret-key" }
```

**流程：**
1. Vercel Serverless Function 接收请求（`api/sync.ts`）
2. 验证 `SYNC_SECRET` 密钥
3. 调用 `runSyncOnce()` 函数
4. 返回统计结果给客户端

---

## 脚本执行流程

### 整体流程图

```
sync-runner.ts (入口)
    ↓
runSyncOnce()
    ├─ 循环 4 个分类：strategy → macro → industry → stock
    │
    └─ 对每个分类执行 syncCategory()
        │
        ├─ Step 1: fetchCategoryList()
        │   ├─ 构建 API 参数（时间范围、分页等）
        │   ├─ 第1页请求 → 得到 40 条数据
        │   ├─ 检查最早日期是否超出范围
        │   │   ├─ 否 → 继续翻页（pageNo++）
        │   │   └─ 是 → 停止翻页
        │   ├─ 第2、3、...页（同上）
        │   └─ 返回所有累积的数据（可能 40+ 条）
        │
        ├─ Step 2: 对每条数据 limit()（并发控制）
        │   └─ 执行异步任务：
        │       ├─ fetchDetailInfo() 获取详情
        │       │   ├─ 打开详情页 HTML
        │       │   ├─ 提取摘要、PDF、标签、评级
        │       │   └─ 返回详情信息
        │       │
        │       ├─ 合并列表数据 + 详情数据
        │       │
        │       └─ 保存到数据库
        │           ├─ findUnique() 查找是否存在
        │           ├─ 存在 → update()
        │           └─ 不存在 → create()
        │
        └─ 返回该分类的统计结果
```

---

## 核心运行机制

### 1. 参数流动

**环境变量** → **buildParams()** → **API 请求**

```typescript
// 环境变量读取
const LOOKBACK_DAYS = Number(process.env.SYNC_LOOKBACK_DAYS ?? "2");  // 默认 2 天

// 转换为日期范围
const formatDate = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);  // 返回 "YYYY-MM-DD"
};

const startDate = formatDate(-LOOKBACK_DAYS);  // 例如 "2025-10-28"
const endDate = formatDate(0);                 // 例如 "2025-10-30"

// 传给 API 的参数
{
  pageNo: 1,
  pageSize: 40,
  beginTime: "2025-10-28",
  endTime: "2025-10-30",
  // ... 其他参数
}
```

### 2. 翻页机制（关键优化点）

**旧方案（已废弃）：**
- "一直翻页直到 API 返回空数组"
- 问题：API 不稳定时，可能漏掉或重复拿数据

**新方案（已改进）：**
```typescript
while (shouldContinue) {
  // 请求 API 的第 pageNo 页
  const currentPageData = await http.get(...);

  if (!currentPageData.length) {
    // API 真的没数据了
    shouldContinue = false;
    break;
  }

  // 检查这一页的最早日期
  const oldestDate = getOldestDate(currentPageData);  // "2025-10-27"

  if (oldestDate < startDate) {
    // 已经翻到时间范围外（2025-10-27 < 2025-10-28）
    shouldContinue = false;
    break;
  }

  // 否则继续翻页
  pageNo += 1;
}
```

**优势：**
- ✅ 时间边界清晰，不会遗漏近期数据
- ✅ 自动适应 API 返回数据量变化
- ✅ 100% 覆盖目标时间范围

### 3. 并发控制机制

```typescript
const limit = pLimit(CONCURRENCY);  // CONCURRENCY = 4

await Promise.all(
  list.map((record) =>
    limit(async () => {
      // 这个函数会被 pLimit 控制
      const detail = await fetchDetailInfo(category, record);
      // 保存到数据库
    })
  )
);
```

**运行示意：**
```
假设有 100 条数据，SYNC_CONCURRENCY=4

时刻 T0:  任务1,2,3,4 开始并行执行
时刻 T1:  任务1 完成 → 任务5 开始
          任务2,3,4 继续执行
时刻 T2:  任务2 完成 → 任务6 开始
          任务3,4,5 继续执行
          ...
时刻 TN:  所有任务完成
```

**关键点：**
- 不是"4 个任务一起做，做完再做下一批"
- 而是"随时有空位就填新任务"
- 这样能更均衡地分配 CPU/网络资源

### 4. 数据库去重与更新

```typescript
const uniqueWhere = {
  title_date_org: {
    title: reportData.title,
    date: reportData.date,
    org: reportData.org,  // 机构名
  },
};

// 检查是否已存在
const existing = await prisma.report.findUnique({ where: uniqueWhere });

if (existing) {
  // 已存在 → 更新
  await prisma.report.update({
    where: { id: existing.id },
    data: reportData
  });
  summary.updated += 1;
} else {
  // 不存在 → 新增
  await prisma.report.create({ data: reportData });
  summary.inserted += 1;
}
```

**唯一键：`(title + date + org)`**
- 同一机构，同一天，标题相同 = 同一篇报告
- 这样既能避免重复，又能应对标题微调的情况

---

## 性能分析

### 时间成本分解

假设：
- 平均每页 40 条数据
- 每个分类需要翻 5 页 → 200 条数据
- 4 个分类 → 总共 800 条数据
- SYNC_CONCURRENCY=4

**列表页抓取：**
```
4 分类 × 5 页 × 1.5秒/请求 = 30 秒
```

**详情页抓取（800条数据，并发4）：**
```
800 条 ÷ 4 = 200 批
200 批 × 2秒/批 = 400 秒 ≈ 6.7 分钟
```

**数据库操作：**
```
800 条数据的 findUnique + create/update
单个查询 ~10ms
800 × 10ms = 8 秒
```

**总耗时：** ~7 分钟

### 性能瓶颈

1. **详情页抓取最耗时** ⏱️
   - 占比：~90% 时间
   - 原因：要打开每个报告的详情页 HTML，等待网络响应

2. **并发数限制**
   - 当前：4
   - 问题：如果设太高（如 20），可能被东方财富 API 限流或 IP 封禁
   - 问题：Serverless 有内存和 CPU 限制

3. **数据库查询**
   - 每条数据都要 findUnique 检查是否存在
   - 如果数据量大（几千条），这里也能感受到延迟

---

## 优化建议

### 优化1：增加并发数（低风险）⚡

**当前：** `SYNC_CONCURRENCY=4`

**建议尝试：** `SYNC_CONCURRENCY=8`

```bash
export SYNC_CONCURRENCY=8
bun run scripts/sync-runner.ts
```

**预期效果：**
- 详情页抓取时间：6.7 分钟 → 3.5 分钟
- **但要注意**：东方财富可能会限流，需要观察是否有大量 HTTP 429/403 错误

**如何验证：**
运行后看输出中的 `totalErrors` 是否大幅增加。

---

### 优化2：批量查询数据库（中等风险）📊

**当前做法：**
```typescript
list.map((record) =>
  limit(async () => {
    const existing = await prisma.report.findUnique(...);  // 每条都查一次
    // ...
  })
);
```

**优化做法：**
```typescript
// 一次性批量查询所有标题
const existingTitles = await prisma.report.findMany({
  where: {
    title: { in: list.map(r => r.title) }
  },
  select: { id: true, title: true }
});
const existingMap = new Map(existingTitles.map(r => [r.title, r.id]));

// 然后在内存中查找
list.map((record) =>
  limit(async () => {
    const existingId = existingMap.get(record.title);
    if (existingId) {
      // 更新
    } else {
      // 新增
    }
  })
);
```

**预期效果：**
- 数据库查询时间：8 秒 → 1 秒
- 减少网络往返次数

**风险：**
- 如果标题有重复，可能判断错误
- 建议改用 `(title, date, org)` 组合查询

---

### 优化3：缓存详情页信息（高风险）🔒

**当前做法：**
- 每次都重新抓取详情页 HTML

**优化做法：**
- 第一次抓取后，缓存到 Redis
- 后续运行直接用缓存（除非数据过期）

**预期效果：**
- 重复运行时，详情页抓取时间：6.7 分钟 → 几秒

**风险：**
- 如果报告内容更新了，缓存会过期
- 需要加 TTL（过期时间）机制
- 增加项目复杂度

---

### 优化4：异步批量保存数据库（中等风险）💾

**当前做法：**
```typescript
await prisma.report.create({ data: reportData });  // 逐条保存
```

**优化做法：**
```typescript
// 累积 10 条后批量保存
await prisma.report.createMany({
  data: [report1, report2, ..., report10],
  skipDuplicates: true
});
```

**预期效果：**
- 数据库写入时间：减少 50-70%

**风险：**
- `createMany` 不支持 upsert（更新或插入），只能创建
- 如果要同时支持更新，逻辑会更复杂

---

## 推荐优化方案（循序渐进）

### 第1步（今天做）：试试增加并发 ✅
```bash
export SYNC_CONCURRENCY=6
bun run scripts/sync-runner.ts
```
看看是否有大量错误，如果没有就改成 8。

### 第2步（本周做）：批量数据库查询
改 `sync-runner.ts` 中的逻辑，减少数据库往返。

### 第3步（可选）：缓存详情页
如果同一个报告经常重复抓取，考虑加 Redis 缓存。

---

## 常见问题

### Q: 为什么抓取这么慢？
A: 主要是在等待详情页 HTML 响应（网络 I/O）。并发数增加可以改善，但别太高。

### Q: 为什么有时候数据漏掉？
A: 旧方案中用"是否有新数据"判断翻页，容易出错。新方案用时间范围判断，更靠谱。

### Q: 怎么知道哪个分类抓取慢？
A: 运行完后看输出的 `categories` 数组，每个分类有 `fetched` 数据量，可以看出来。

### Q: 可以中途停止吗？
A: 按 `Ctrl+C` 就会停。但数据库已保存的不会回滚。

---

## 总结

| 方面 | 当前状态 | 瓶颈 | 优化难度 |
|------|--------|------|--------|
| **列表页抓取** | ~30 秒 | 无法并发（顺序翻页） | 低 |
| **详情页抓取** | ~6.7 分钟 | 并发数太小（仅 4） | 中 |
| **数据库查询** | ~8 秒 | 逐条查询 | 中 |
| **数据库写入** | ~2 秒 | 逐条写入 | 高 |

**最容易见效的优化：增加并发数从 4 → 6-8**

