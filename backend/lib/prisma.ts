import { PrismaClient } from "@prisma/client";

/**
 * 这里使用单例模式（single instance），这样在开发环境热更新时不会重复创建数据库连接。
 * PrismaClient：Prisma 提供的数据库客户端，用来执行查询。
 */
const globalCache = globalThis as unknown as { prisma?: PrismaClient };

/**
 * 如果全局已经有客户端实例，就直接复用；否则就创建新的客户端。
 */
export const prisma =
  globalCache.prisma ??
  new PrismaClient({
    log: ["error", "warn"], // 记录错误和告警，帮助排查问题。
  });

/**
 * 在非生产环境里，把客户端存回全局对象，防止每次热更新都新建连接。
 */
if (process.env.NODE_ENV !== "production") {
  globalCache.prisma = prisma;
}
