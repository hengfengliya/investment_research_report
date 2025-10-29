import { Hono } from "hono";
import { handle } from "hono/vercel";

const app = new Hono();

/**
 * GET /api/health
 * 简单的健康检查 endpoint，测试 Vercel Functions 基本功能
 */
app.get(async (c) => {
  try {
    // 测试环境变量
    const hasDbUrl = !!process.env.DATABASE_URL;

    // 尝试导入 Prisma（不实际使用）
    let prismaAvailable = false;
    try {
      await import("@prisma/client");
      prismaAvailable = true;
    } catch (e) {
      // Prisma 导入失败
    }

    return c.json({
      success: true,
      message: "Vercel Functions 正常工作",
      checks: {
        environmentVariables: hasDbUrl,
        prismaClientAvailable: prismaAvailable,
        nodeVersion: process.version,
        platform: process.platform,
      },
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "健康检查失败",
      },
      500,
    );
  }
});

export default handle(app);
