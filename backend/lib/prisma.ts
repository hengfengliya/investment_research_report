import { PrismaClient } from "@prisma/client";

/**
 * 通过单例缓存避免在开发环境热重载时重复创建数据库连接。
 */
const globalCache = globalThis as unknown as { prisma?: PrismaClient };

/**
 * 若全局已有 PrismaClient 实例则直接复用，否则新建一个客户端。
 */
export const prisma =
  globalCache.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

/**
 * 在非生产环境下，把客户端缓存到全局对象，防止每次热更新都重新连接数据库。
 */
if (process.env.NODE_ENV !== "production") {
  globalCache.prisma = prisma;
}
