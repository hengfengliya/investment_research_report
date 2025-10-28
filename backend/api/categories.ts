import { Hono } from "hono";
import { handle } from "hono/vercel";
import { getCategoryStats } from "../services/report-service";

const app = new Hono();

/**
 * GET /api/categories
 * 作用：返回各个分类的研报数量。
 */
app.get(async (c) => {
  const stats = await getCategoryStats();
  return c.json({ success: true, data: stats });
});

export default handle(app);
