# GitHub Actions 自动化抓取指南

## 什么是 GitHub Actions？

GitHub Actions 是 GitHub 提供的**免费自动化工具**，可以：
- ✅ 定时运行脚本（如每天、每周）
- ✅ 在代码提交时自动测试或构建
- ✅ 无需开启自己的电脑，在 GitHub 服务器上运行

**类比：** 就像你雇了一个机器人，每天早上自动去东方财富拿数据，然后存到你的数据库里。

---

## 🚀 快速设置（5 步）

### Step 1：上传配置文件

我已经为你创建了 `.github/workflows/daily-sync.yml` 文件。

确认文件存在：
```
你的项目/
├─ .github/
│  └─ workflows/
│     └─ daily-sync.yml          ← 这个文件
```

### Step 2：推送到 GitHub

```powershell
cd C:\Users\18805\Desktop\word\CC\investment-research-report

# 提交文件
git add .github/workflows/daily-sync.yml
git commit -m "feat: 添加 GitHub Actions 每日自动抓取配置"
git push origin main
```

### Step 3：配置 GitHub Secrets

GitHub Actions 需要敏感信息（如数据库连接字符串），不能直接写在配置文件里。要通过 "Secrets" 存储。

**在 GitHub 网页上操作：**

1. 打开你的仓库：https://github.com/你的用户名/investment-research-report
2. 点击 "Settings"（设置）
3. 左侧菜单 → "Secrets and variables" → "Actions"
4. 点击 "New repository secret"（新建密钥）

**添加这两个密钥：**

| 名称 | 值 | 说明 |
|------|-----|------|
| `DATABASE_URL` | `postgresql://...` | 从 `.env` 文件复制 |
| `SYNC_SECRET` | `demo-secret-key` | 从 `.env` 文件复制 |

**具体步骤：**
```
Name: DATABASE_URL
Value: postgresql://neondb_owner:npg_me91zWbTBDpj@ep-steep-unit-adwx68g1-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

点击 "Add secret"
```

重复操作，添加第二个 `SYNC_SECRET`。

### Step 4：验证工作流

1. 在 GitHub 仓库页面，点击 "Actions" 标签
2. 你应该能看到 "Daily Sync Research Reports" 工作流
3. 如果没看到，等待几秒钟，刷新页面

### Step 5：测试

点击工作流 → "Run workflow" → "Run workflow"

这会立即执行一次抓取，不用等到明天。

---

## 📅 运行时间说明

配置文件中的时间：
```yaml
schedule:
  - cron: '0 8 * * *'
```

这表示：**每天 UTC 时间 8 点运行**

**时区转换：**
- UTC 8:00 = **北京时间 16:00**（下午 4 点）
- UTC 0:00 = 北京时间 08:00（早上 8 点）

**如果你想改时间：**

想在北京时间**早上 9 点**运行？
- 北京时间 09:00 - 8 小时 = UTC 01:00
- 改成：`cron: '0 1 * * *'`

### Cron 表达式说明

```
0 8 * * *
│ │ │ │ └─ 星期（0-6，0 是周日）
│ │ │ └─── 月份（1-12）
│ │ └───── 天（1-31）
│ └─────── 小时（0-23）
└───────── 分钟（0-59）

示例：
0 8 * * *     = 每天 08:00
0 9 * * 1-5   = 周一到周五 09:00
0 0 * * 0     = 每周日 00:00
0 */6 * * *   = 每 6 小时一次
```

---

## 🔍 查看运行日志

### 查看日志方法

1. GitHub 仓库 → "Actions" 标签
2. 左侧选择 "Daily Sync Research Reports"
3. 点击某次运行的记录
4. 展开 "Run sync script" 看详细输出

### 日志中会显示

```
Starting sync...
总共抓了 450 条
新增 200 条
更新 150 条
错误 0 条
✅ 同步完成！
```

---

## 🎛️ 自定义配置

### 改变运行频率

**每周一运行：**
```yaml
schedule:
  - cron: '0 8 * * 1'
```

**每天两次（早 8 点 + 晚 8 点）：**
```yaml
schedule:
  - cron: '0 8 * * *'
  - cron: '0 20 * * *'
```

**修改后记得：**
```powershell
git add .github/workflows/daily-sync.yml
git commit -m "fix: 改变 GitHub Actions 运行时间"
git push origin main
```

---

## 💾 修改抓取参数

如果你想改 `SYNC_LOOKBACK_DAYS` 或 `SYNC_CONCURRENCY`，编辑工作流文件：

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  SYNC_LOOKBACK_DAYS: 2      # ← 改这个
  SYNC_CONCURRENCY: 8         # ← 或这个
```

改好后推送到 GitHub：
```powershell
git add .github/workflows/daily-sync.yml
git commit -m "fix: 调整自动抓取的并发数"
git push origin main
```

---

## ⚠️ 常见问题

### Q: 工作流没有运行

**原因1：** 还没推送到 GitHub

**解决：**
```powershell
git push origin main
```

**原因2：** Secrets 没有配置

**检查：** Settings → Secrets and variables → Actions 中有没有 `DATABASE_URL`

---

### Q: 运行时报错 "DATABASE_URL 不存在"

**原因：** Secrets 名称拼写错误

**检查：**
- Secrets 中的名称：`DATABASE_URL`
- 工作流文件中的引用：`${{ secrets.DATABASE_URL }}`
- 要完全一致（区分大小写）

---

### Q: 想禁用自动运行

**临时禁用：**
1. Actions 标签 → Daily Sync Research Reports
2. 点击右上角 "..." → Disable workflow

**彻底删除：**
```powershell
git rm .github/workflows/daily-sync.yml
git commit -m "remove: 删除 GitHub Actions 自动抓取"
git push origin main
```

---

### Q: 运行失败了怎么办？

1. GitHub Actions 页面查看日志
2. 看错误信息（通常会指出问题）
3. 常见原因：
   - ❌ Secrets 配置错误
   - ❌ 数据库连接断开
   - ❌ 东方财富 API 被限流

---

## 📊 监控任务运行

### 查看历史运行记录

1. GitHub 仓库 → Actions
2. 左侧选择 "Daily Sync Research Reports"
3. 看右侧的运行列表

### 绿色 ✅ vs 红色 ❌

- ✅ 绿色 = 成功
- ❌ 红色 = 失败

点击看详细日志。

---

## 🎯 完整工作流程总结

```
每天 16:00 (北京时间)
    ↓
GitHub 自动运行工作流
    ↓
检出代码 → 安装 Bun → 安装依赖 → 生成 Prisma → 运行脚本
    ↓
拉取最近 2 天的研报
    ↓
存入数据库
    ↓
发送通知（如果失败）
```

---

## 📝 注意事项

### 定时任务可能延迟

GitHub Actions 的定时任务不是精确到秒的，可能延迟 5-10 分钟。

### 免费配额

GitHub Actions 有免费配额：
- 免费账户：**3,000 分钟/月**
- 我们的任务：~3 分钟 × 30 天 = ~90 分钟/月
- ✅ 完全足够，不会超过

### 最佳实践

1. ✅ 定期检查日志，确保任务正常运行
2. ✅ 每周手动运行一次测试（点击 "Run workflow"）
3. ✅ 如果发现错误，及时调整配置

---

## 🔄 与手动运行的区别

| 方面 | 手动运行 | GitHub Actions |
|------|--------|-----------------|
| 时间 | 你决定什么时候 | 自动定时 |
| 需要开电脑 | ✅ 需要 | ❌ 不需要 |
| 可靠性 | 取决于网络 | GitHub 服务器保证 |
| 成本 | 免费 | 免费（配额充足） |

---

## 完成！

现在你的研报数据会每天自动同步。不需要做任何事，机器人会帮你处理 🤖

