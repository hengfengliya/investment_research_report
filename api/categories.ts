import { Hono } from "hono";
import type { Context } from "hono";
import { handle } from "hono/vercel";
import { db } from "../backend/dist/lib/db.js";
import { reports } from "../backend/dist/lib/schema.js";
import { count } from "drizzle-orm";

const app = new Hono();

app.use("*", async (c, next) => {
  console.log("[API] /categories path", c.req.path);
  return next();
});

const handleCategories = async (c: Context) => {
  console.log("[API] /categories 请求进入");

  try {
    // 使用 Drizzle 分组查询
    // 注意：Drizzle 的分组查询语法
    const categories = await db
      .select({
        category: reports.category,
        count: count(),
      })
      .from(reports)
      .groupBy(reports.category);

    const stats = categories.map((item) => ({
      category: item.category,
      count: item.count,
    }));

    console.log("[API] /categories 成功返回", stats.length, "个分类");

    // ✅ 无需 disconnect - HTTP 请求自动清理
    return c.json({ success: true, data: stats });
  } catch (error) {
    console.error("[API] /categories 查询失败", error);
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "分类统计查询失败，请稍后再试",
      },
      500,
    );
  }
};

app.get("/", handleCategories);
app.get("/categories", handleCategories);

export default handle(app);
