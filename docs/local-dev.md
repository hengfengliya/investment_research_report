# 本地开发调试指南

以下步骤可以帮助你在本地把后端 API 与前端界面跑通，再部署到 Vercel。

## 1. 安装依赖

- Node.js ≥ 20（建议使用 `nvm` 或者官方安装包）。
- 可选：Bun（`backend` 目录提供了 Bun 脚本，但没有也可以使用 Node）。
- 安装工作区依赖：

```powershell
npm install
```

## 2. 准备环境变量

根目录已经提供 `.env.example`，复制并填写你的 Neon 数据库连接串。

```powershell
Copy-Item .env.example .env
```

然后在终端导出本地要用的变量（示例使用 PowerShell）。

```powershell
$env:DATABASE_URL = (Get-Content .env | Where-Object { $_ -like 'DATABASE_URL=*' } | % { $_.Split('=')[1] })
$env:SYNC_SECRET   = 'demo-secret-key'
$env:PORT          = '4000'
```

> 如果你使用的是其他 Shell（如 bash/zsh），把上述命令改成 `export` 形式即可。

## 3. 启动后端 API

在项目根目录执行：

```powershell
npx tsx backend/server.ts
```

终端看到类似 `本地服务器启动于 http://localhost:4000` 的输出即表示成功。此时可以访问：

- `http://localhost:4000/api/health`：检查环境变量和 Prisma 是否就绪。
- `http://localhost:4000/api/reports`：验证列表数据。

## 4. 启动前端页面

另开一个终端，执行：

```powershell
cd frontend
$env:VITE_API_BASE_URL = 'http://localhost:4000/api'
npm run dev
```

浏览器访问终端提示的地址（默认 `http://localhost:5173`），即可看到联调后的页面。

## 5. 本地模拟 Vercel Functions

如果想直接调用与 Vercel 同一份的 API 函数，可以在根目录运行：

```powershell
npx tsx api/reports.ts
```

确保在执行前已经导出了 `DATABASE_URL`、`SYNC_SECRET` 等变量。

## 6. 构建产物自检

部署前可以执行一次预构建，确认 Prisma Client、后端和前端都能打包成功：

```powershell
npm run vercel-build
```

该命令会依次运行 `prisma generate`、`backend`/`frontend` 的构建脚本。

## 7. 常见问题

- **Neon 免费实例休眠**：首次请求可能稍慢，等待几秒即可。若担心连接数限制，可以改用 Neon 提供的连接池连接串。
- **Prisma 二进制缺失**：本仓库在 `prisma/schema.prisma` 中指定了 `binaryTargets = ["native", "debian-openssl-3.0.x"]`，并在构建后把运行时复制进 `backend/dist/node_modules`，确保部署时不再额外下载。

按照上述流程确认本地运行正常后，再推送代码触发 Vercel 部署，一般就不会遇到超时问题了。

