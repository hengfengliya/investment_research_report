# 📚 文档中心

欢迎查阅东方财富研报聚合系统的文档！本目录包含所有技术文档和使用指南。

---

## 🚀 快速导航

### 新用户必读 ⭐

如果你是第一次使用本系统，请按以下顺序阅读：

1. **[抓取完全指南](sync-complete-guide.md)** 📖 **← 强烈推荐！**
   - 最新、最全面的抓取功能文档
   - 涵盖所有抓取场景和使用方法
   - 包含详细的故障排查

2. **[本地开发指南](local-dev.md)** 💻
   - 环境搭建和初次运行
   - 开发流程和调试技巧

3. **[抓取机制详解](sync-mechanism.md)** 🔍
   - 深入理解抓取工作原理
   - 数据流程和技术实现

---

## 📖 文档分类

### 🌐 数据抓取相关（核心）

| 文档 | 用途 | 推荐度 | 更新状态 |
|------|------|--------|----------|
| **[sync-complete-guide.md](sync-complete-guide.md)** | **抓取完全指南** - 所有抓取功能的完整参考 | ⭐⭐⭐⭐⭐ | ✅ 最新 (v2.0) |
| [quick-start-sync.md](quick-start-sync.md) | 快速上手指南 - 3步运行抓取脚本 | ⭐⭐⭐⭐ | ⚠️ 已整合到 sync-complete-guide.md |
| [sync-mechanism.md](sync-mechanism.md) | 抓取机制详解 - 技术实现原理 | ⭐⭐⭐ | ✅ 有效 |
| [data-sync-guide.md](data-sync-guide.md) | 数据同步指南 - 正常抓取 + 错误重试 | ⭐⭐⭐ | ⚠️ 已整合到 sync-complete-guide.md |
| [optimization-done.md](optimization-done.md) | 性能优化记录 - 优化历史和结果 | ⭐⭐ | ✅ 有效 |

**推荐阅读顺序**:
1. 先读 **sync-complete-guide.md**（全面了解）
2. 需要深入了解再读 **sync-mechanism.md**（技术原理）
3. 想了解优化历程读 **optimization-done.md**（可选）

---

### 🤖 自动化部署

| 文档 | 用途 | 推荐度 | 更新状态 |
|------|------|--------|----------|
| [github-actions-setup.md](github-actions-setup.md) | GitHub Actions 自动化配置 | ⭐⭐⭐⭐ | ✅ 有效 |

---

### 💻 开发相关

| 文档 | 用途 | 推荐度 | 更新状态 |
|------|------|--------|----------|
| [local-dev.md](local-dev.md) | 本地开发环境搭建 | ⭐⭐⭐⭐ | ✅ 有效 |
| [implementation-plan.md](implementation-plan.md) | 项目实施计划 | ⭐⭐ | 📝 历史文档 |
| [progress.md](progress.md) | 开发进度日志 | ⭐⭐ | 📝 历史文档 |

---

### 🐛 调试与测试

| 文档 | 用途 | 推荐度 | 更新状态 |
|------|------|--------|----------|
| [serverless-timeout-debugging-guide.md](serverless-timeout-debugging-guide.md) | Serverless 超时调试 | ⭐⭐⭐ | ✅ 有效 |
| [sync-test-report.md](sync-test-report.md) | 抓取测试报告 | ⭐⭐ | 📝 历史参考 |

---

### 🎨 UI/UX 设计

| 文档 | 用途 | 推荐度 | 更新状态 |
|------|------|--------|----------|
| [frontend-redesign-requirements.md](frontend-redesign-requirements.md) | 前端重设计需求 | ⭐⭐ | ✅ 有效 |
| [ui-redesign-summary.md](ui-redesign-summary.md) | UI 重设计总结 | ⭐⭐ | ✅ 有效 |
| [behance-inspired-ui-design.md](behance-inspired-ui-design.md) | Behance 风格设计参考 | ⭐ | 📝 设计参考 |
| [ui-testing-checklist.md](ui-testing-checklist.md) | UI 测试检查清单 | ⭐⭐ | ✅ 有效 |

---

### 📚 技术栈与经验

| 文档 | 用途 | 推荐度 | 更新状态 |
|------|------|--------|----------|
| [TECH-STACK-EXPERIENCE.md](TECH-STACK-EXPERIENCE.md) | 技术栈选型经验 | ⭐⭐⭐ | ✅ 有效 |

---

## 🎯 按场景查找文档

### 场景 1: 我想开始抓取数据

👉 阅读 **[抓取完全指南](sync-complete-guide.md)**

这是最全面的抓取文档，包含：
- 三种抓取方式的详细说明
- 所有配置参数
- 常见场景和故障排查

---

### 场景 2: 我遇到了抓取错误

👉 阅读 **[抓取完全指南 - 故障排查章节](sync-complete-guide.md#故障排查)**

包含：
- 常见错误及解决方法
- 超时处理
- 网络问题排查

---

### 场景 3: 我想了解抓取的技术原理

👉 阅读 **[抓取机制详解](sync-mechanism.md)**

包含：
- 数据流程图
- 技术实现细节
- 去重逻辑
- 错误处理机制

---

### 场景 4: 我想设置自动化抓取

👉 阅读 **[GitHub Actions 自动化配置](github-actions-setup.md)**

包含：
- GitHub Actions 配置
- 定时任务设置
- Secrets 配置

---

### 场景 5: 我想本地开发调试

👉 阅读 **[本地开发指南](local-dev.md)**

包含：
- 环境搭建
- 开发流程
- 调试技巧

---

### 场景 6: 遇到 Serverless 超时问题

👉 阅读 **[Serverless 超时调试指南](serverless-timeout-debugging-guide.md)**

包含：
- 超时原因分析
- 调试方法
- 解决方案

---

## 🔄 文档更新记录

### 最近更新（2025-11-04）

- ✨ **新增**: `sync-complete-guide.md` - 最全面的抓取文档 v2.0
- ✨ **新增**: `docs/README.md` - 本文档索引
- ✅ **更新**: 错误日志统一存放到 `error-logs/` 文件夹
- ✅ **更新**: 错误重试支持智能路径查找

### 历史更新

- 2025-11-03: 创建 `data-sync-guide.md` - 数据同步指南 v1.0
- 2025-10-xx: 创建 `quick-start-sync.md` - 快速上手指南
- 2025-10-xx: 创建 `sync-mechanism.md` - 抓取机制详解

---

## 📝 文档状态说明

| 标记 | 含义 |
|------|------|
| ✅ 最新 | 文档是最新版本，推荐阅读 |
| ✅ 有效 | 文档内容仍然有效，可以参考 |
| ⚠️ 已整合 | 内容已被整合到其他文档，可以不看 |
| 📝 历史文档 | 历史参考文档，不影响使用 |
| 📝 设计参考 | 设计阶段的参考文档 |

---

## 🆘 需要帮助？

### 优先查找文档

遇到问题时，请先按以下顺序查找：

1. 📖 **[抓取完全指南](sync-complete-guide.md)** - 包含 90% 的常见问题
2. 🔍 使用 Ctrl+F 在文档中搜索关键词
3. 📂 查看 `error-logs/` 文件夹中的错误日志
4. 💬 如果仍未解决，提交 Issue

### 文档反馈

如果你发现文档中的问题：
- ❌ 内容错误
- 📝 描述不清
- 🔗 链接失效
- 💡 建议改进

请提交 Issue 并标注文档名称。

---

## 📚 推荐阅读路径

### 路径 A: 快速上手（30 分钟）

适合只想快速使用的用户：

1. [抓取完全指南 - 快速开始](sync-complete-guide.md#快速开始) (5 分钟)
2. [抓取完全指南 - 每日增量抓取](sync-complete-guide.md#方式一每日增量抓取推荐) (10 分钟)
3. [抓取完全指南 - 常见场景](sync-complete-guide.md#常见场景) (15 分钟)

### 路径 B: 全面了解（2 小时）

适合想深入了解的用户：

1. [抓取完全指南](sync-complete-guide.md) (60 分钟)
2. [抓取机制详解](sync-mechanism.md) (30 分钟)
3. [GitHub Actions 自动化](github-actions-setup.md) (20 分钟)
4. [性能优化记录](optimization-done.md) (10 分钟)

### 路径 C: 开发者路径（4 小时）

适合想参与开发的用户：

1. [本地开发指南](local-dev.md) (30 分钟)
2. [抓取完全指南](sync-complete-guide.md) (60 分钟)
3. [抓取机制详解](sync-mechanism.md) (60 分钟)
4. [技术栈经验](TECH-STACK-EXPERIENCE.md) (30 分钟)
5. 阅读源码注释 (60 分钟)

---

**最后更新**: 2025-11-04
**文档总数**: 15 篇
**维护状态**: ✅ 活跃维护中
