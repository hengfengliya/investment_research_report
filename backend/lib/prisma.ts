import { PrismaClient } from "@prisma/client";

/**
 * 通过单例缓存避免在所有环境（包括 Serverless）重复创建数据库连接。
 */
const globalCache = globalThis as unknown as { prisma?: PrismaClient };

/**
 * 创建 Prisma 客户端，针对 Neon + Vercel Serverless 优化配置。
 */
function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("数据库连接字符串缺失，请在 Vercel 环境变量中配置 DATABASE_URL");
  }
  console.log("[Prisma][2025-10-29-02] 即将初始化客户端，目标数据库：", databaseUrl.split("@").at(-1));

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
}

/**
 * 若全局已有 PrismaClient 实例则直接复用，否则新建一个客户端。
 * 在 Serverless 环境（Vercel Functions）也需要缓存，避免连接池耗尽。
 */
export const prisma = globalCache.prisma ?? createPrismaClient();

/**
 * 在所有环境下都缓存客户端实例，Serverless 环境也会复用同一个函数实例。
 */
if (!globalCache.prisma) {
  globalCache.prisma = prisma;
}

/**
 * 在 Serverless 环境中，函数执行完毕后主动断开连接，避免连接泄漏。
 * Vercel Functions 会在适当时机调用此清理函数。
 */
if (typeof process !== "undefined" && process.env.VERCEL) {
  // 注册清理函数，在函数冷启动结束时断开
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
}
