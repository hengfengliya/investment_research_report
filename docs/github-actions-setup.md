# GitHub Actions 自动化抓取指引

## 什么是 GitHub Actions
GitHub Actions 是 GitHub 提供的自动化工作流服务，可以：
- 定时运行脚本（如每天、每周）
- 在代码提交时自动测试或构建
- 无需开启本地电脑，在 GitHub 的服务器上运行

类比：就像雇了一个机器人，每天按时去目标网站抓取公开数据，然后写入你的数据库。

---

## 快速设置（5 步）

### Step 1：上传配置文件
确保仓库中存在 `.github/workflows/daily-sync.yml`。

### Step 2：推送到 GitHub
```powershell
cd C:\Users\18805\Desktop\word\CC\investment-research-report

# 提交文件
git add .github/workflows/daily-sync.yml
git commit -m "feat: add GitHub Actions daily sync workflow"
git push origin main
```

### Step 3：配置 GitHub Secrets
GitHub Actions 的敏感信息（如数据库连接）需要保存在仓库 Settings 的 Secrets 中。

在 GitHub 网页上操作：
1. 打开你的仓库：https://github.com/你的用户名/investment-research-report
2. 点击 Settings（设置）
3. 左侧选择 Secrets and variables -> Actions
4. 点击 New repository secret

建议添加以下密钥：

| 名称 | 值 | 说明 |
|------|----|------|
| `DATABASE_URL` | `postgresql://...` | 从 `.env` 文件复制 |
| `SYNC_SECRET`  | `demo-secret-key`   | 从 `.env` 文件复制 |

### Step 4：验证工作流
1. 进入仓库的 Actions 标签
2. 找到 “Daily Sync Research Reports” 工作流
3. 如未出现，等待几秒刷新页面

### Step 5：测试
在 Actions 页面，点击 “Run workflow” 按钮进行一次手动执行。

---

## 运行时间说明（cron）
工作流片段：
```yaml
schedule:
  - cron: '0 8 * * *'
```
含义：每天 UTC 时间 08:00 运行。

时区转换：
- UTC 08:00 = 北京时间 16:00
- UTC 00:00 = 北京时间 08:00

如果要改为北京时间 09:00 运行：09:00 - 8 小时 = UTC 01:00，对应 `cron: '0 1 * * *'`。

常见示例：
```
0 8 * * *     = 每天 08:00
0 9 * * 1-5   = 周一到周五 09:00
0 0 * * 0     = 每周日 00:00
0 */6 * * *   = 每 6 小时一次
```

---

## 查看运行日志
1. 打开仓库 -> Actions
2. 选择 “Daily Sync Research Reports”
3. 点击某次运行记录，展开 “Run sync script” 查看日志

日志示例：
```
Starting sync...
总共抓了 450 条，新增 200，更新 150，错误 0 —— 同步完成
```

