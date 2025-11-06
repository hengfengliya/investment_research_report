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

  // 移除可能导致连接问题的参数
  if (parsed.searchParams.get("channel_binding") === "require") {
    parsed.searchParams.delete("channel_binding");
  }

  // 为 Neon 数据库优化连接参数
  // connect_timeout: 连接超时时间（秒），Neon 冷启动需要更长时间
  if (!parsed.searchParams.has("connect_timeout")) {
    parsed.searchParams.set("connect_timeout", "30");
  }

  // pool_timeout: 从连接池获取连接的超时时间（秒）
  if (!parsed.searchParams.has("pool_timeout")) {
    parsed.searchParams.set("pool_timeout", "30");
  }

  return parsed.toString();
}

// 导出工厂函数，每次请求创建新客户端
export function createPrismaClient() {
  const databaseUrl = prepareDatabaseUrl();
  console.log("[Prisma] 创建独立客户端实例（Serverless 模式），目标：", databaseUrl.split("@").at(-1));

  // 优化连接池配置以支持高并发场景
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
}

// 重试机制：处理临时连接失败
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);

      // 只对连接错误进行重试
      if (
        message.includes("Can't reach database server") ||
        message.includes("connection refused") ||
        message.includes("ECONNREFUSED") ||
        message.includes("ETIMEDOUT")
      ) {
        if (attempt < maxAttempts) {
          console.warn(
            `[Prisma] 连接失败 (第 ${attempt}/${maxAttempts} 次)，${delayMs}ms 后重试...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          delayMs *= 1.5;
          continue;
        }
      }

      throw error;
    }
  }

  throw lastError;
}

// 导出重试包装函数供脚本使用
export { withRetry };

// 兼容旧代码，但不推荐在 Serverless 中使用单例
export const prisma = createPrismaClient();
