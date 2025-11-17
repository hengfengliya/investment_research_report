#!/usr/bin/env bun

/**
 * 数据库连接测试脚本
 * 用途：诊断 Prisma 连接问题，特别是在 GitHub Actions 环境中
 *
 * 运行方式：
 *   本地: bun run scripts/test-db-connection.ts
 *   GitHub Actions: bunx tsx scripts/test-db-connection.ts
 */

import { createPrismaClient, withRetry } from "../lib/prisma.js";

async function testConnection() {
  console.log("=".repeat(60));
  console.log("数据库连接测试开始");
  console.log("=".repeat(60));

  // 检查环境变量
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL 环境变量未设置！");
    process.exit(1);
  }

  // 显示连接目标（隐藏敏感信息）
  const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ":***@");
  console.log(`\n📡 目标数据库: ${maskedUrl}\n`);

  // 创建客户端
  const prisma = createPrismaClient();

  try {
    console.log("⏳ 尝试连接数据库...");

    // 使用重试机制执行简单查询
    const startTime = Date.now();

    const result = await withRetry(
      async () => {
        // 执行最简单的查询测试连接
        return await prisma.$queryRaw<Array<{ now: Date }>>`SELECT NOW() as now`;
      },
      5, // 最多重试 5 次
      2000 // 初始延迟 2 秒（Neon 唤醒需要时间）
    );

    const duration = Date.now() - startTime;

    console.log(`✅ 连接成功！耗时 ${duration}ms`);
    console.log(`📅 数据库时间: ${result[0]?.now}`);

    // 测试查询研报表
    console.log("\n⏳ 测试查询 Report 表...");
    const reportCount = await prisma.report.count();
    console.log(`✅ Report 表包含 ${reportCount} 条记录`);

    // 获取最新一条记录
    if (reportCount > 0) {
      const latestReport = await prisma.report.findFirst({
        orderBy: { createdAt: "desc" },
        select: { title: true, category: true, date: true }
      });
      console.log(`📰 最新研报: ${latestReport?.title} (${latestReport?.category}, ${latestReport?.date})`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ 所有测试通过！数据库连接正常");
    console.log("=".repeat(60));

  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ 数据库连接失败");
    console.error("=".repeat(60));

    if (error instanceof Error) {
      console.error(`\n错误类型: ${error.name}`);
      console.error(`错误信息: ${error.message}`);

      // 提供诊断建议
      if (error.message.includes("Can't reach database server")) {
        console.error("\n💡 可能原因:");
        console.error("  1. Neon 数据库处于休眠状态（免费版会自动休眠）");
        console.error("  2. 网络连接问题（防火墙/DNS）");
        console.error("  3. 数据库连接字符串错误");
        console.error("\n🔧 解决方案:");
        console.error("  - 访问 Neon 控制台手动唤醒数据库");
        console.error("  - 检查 DATABASE_URL 是否正确");
        console.error("  - 确保移除了 channel_binding=require 参数");
      } else if (error.message.includes("authentication failed")) {
        console.error("\n💡 认证失败，请检查:");
        console.error("  - 数据库用户名和密码是否正确");
        console.error("  - DATABASE_URL 格式是否正确");
      }
    } else {
      console.error(error);
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行测试
testConnection().catch((error) => {
  console.error("脚本执行失败:", error);
  process.exit(1);
});
