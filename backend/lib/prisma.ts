import { PrismaClient } from "@prisma/client";

/**
 * 通过单例缓存避免在所有环境（包括 Serverless）重复创建数据库连接。
 */
const globalCache = globalThis as unknown as { prisma?: PrismaClient };

/**
 * 若全局已有 PrismaClient 实例则直接复用，否则新建一个客户端。
 * 在 Serverless 环境（Vercel Functions）也需要缓存，避免连接池耗尽。
 */
export const prisma =
  globalCache.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

/**
 * 在所有环境下都缓存客户端实例，Serverless 环境也会复用同一个函数实例。
 */
if (!globalCache.prisma) {
  globalCache.prisma = prisma;
}
