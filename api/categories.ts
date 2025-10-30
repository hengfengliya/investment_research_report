import { Hono } from "hono";
import type { Context } from "hono";
import { handle } from "hono/vercel";
import { neon } from "@neondatabase/serverless";

const app = new Hono();
const sql = neon(process.env.DATABASE_URL!);

app.use("*", async (c, next) => {
  console.log("[API] /categories path", c.req.path);
  return next();
});

const handleCategories = async (c: Context) => {
  console.log("[API] /categories 请求进入");

  try {
    // 使用 Neon SQL 直接查询（避免 ORM 类型问题）
    const categories = await sql(
      `SELECT category, COUNT(*) as count FROM "Report" GROUP BY category`
    );

    const stats = categories.map((item: any) => ({
      category: item.category,
      count: Number(item.count),
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
