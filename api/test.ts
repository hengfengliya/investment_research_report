import { Hono } from "hono";
import { handle } from "hono/vercel";
import { PrismaClient } from "@prisma/client";

const app = new Hono();

// 直接在 API 文件中创建 Prisma 客户端
const prisma = new PrismaClient();

/**
 * GET /api/test
 * 测试 Prisma 数据库连接
 */
app.get(async (c) => {
  try {
    // 尝试查询数据库
    const count = await prisma.report.count();

    return c.json({
      success: true,
      message: "数据库连接成功",
      reportCount: count,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "数据库查询失败",
        errorDetails: String(error),
      },
      500,
    );
  }
});

export default handle(app);
