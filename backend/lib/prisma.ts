import { PrismaClient } from "@prisma/client";

function prepareDatabaseUrl() {
  const rawDatabaseUrl = process.env.DATABASE_URL;
  if (!rawDatabaseUrl) {
    throw new Error("数据库连接字符串缺失，请在 Vercel 环境变量中配置 DATABASE_URL");
  }

  const parsed = new URL(rawDatabaseUrl);
  if (parsed.searchParams.get("channel_binding") === "require") {
    parsed.searchParams.delete("channel_binding");
  }

  return parsed.toString();
}

// 导出工厂函数，每次请求创建新客户端
export function createPrismaClient() {
  const databaseUrl = prepareDatabaseUrl();
  console.log("[Prisma] 创建独立客户端实例（Serverless 模式），目标：", databaseUrl.split("@").at(-1));

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
}

// 兼容旧代码，但不推荐在 Serverless 中使用单例
export const prisma = createPrismaClient();
