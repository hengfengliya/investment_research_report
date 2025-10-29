import { Hono } from "hono";
import { handle } from "hono/vercel";
import { getCategoryStats } from "../backend/services/report-service";

const app = new Hono();

/**
 * GET /api/categories
 * 作用：返回各个分类的研报数量。
 */
app.get(async (c) => {
  try {
    const stats = await getCategoryStats();
    return c.json({ success: true, data: stats });
  } catch (error) {
    console.error("分类统计查询失败:", error);
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "分类统计查询失败，请稍后再试",
      },
      500,
    );
  }
});

export default handle(app);
