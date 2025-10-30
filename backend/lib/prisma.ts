import { PrismaClient } from "@prisma/client";

const globalCache = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const rawDatabaseUrl = process.env.DATABASE_URL;
  if (!rawDatabaseUrl) {
    throw new Error("数据库连接字符串缺失，请在 Vercel 环境变量中配置 DATABASE_URL");
  }

  const parsed = new URL(rawDatabaseUrl);
  if (parsed.searchParams.get("channel_binding") === "require") {
    parsed.searchParams.delete("channel_binding");
    console.log("[Prisma] 移除 channel_binding=require 以兼容 Node.js 20 Serverless 运行时");
  }

  // 添加连接池参数：限制连接数，设置超时
  parsed.searchParams.set("connection_limit", "1");
  parsed.searchParams.set("pool_timeout", "0");

  const databaseUrl = parsed.toString();
  console.log("[Prisma][2025-10-30] 初始化客户端（连接池优化模式），目标数据库：", databaseUrl.split("@").at(-1));

  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  return client;
}

export const prisma = globalCache.prisma ?? createPrismaClient();

if (!globalCache.prisma) {
  globalCache.prisma = prisma;
}
