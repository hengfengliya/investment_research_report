import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

// 自动加载 .env 文件（如果存在）
const __filename = fileURLToPath(import.meta.url);
const projectRoot = resolve(dirname(__filename), "../..");
const envPath = resolve(projectRoot, ".env");

try {
  if (process.env.DATABASE_URL === undefined) {
    const envContent = readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        const value = valueParts.join("=");
        if (key && value) {
          const cleanKey = key.trim();
          const cleanValue = value.trim().replace(/^["']|["']$/g, "");
          if (!process.env[cleanKey]) {
            process.env[cleanKey] = cleanValue;
          }
        }
      }
    });
  }
} catch {
  // .env 文件不存在或无法读取，使用系统环境变量
}

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
