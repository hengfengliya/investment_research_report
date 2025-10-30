import { Hono } from "hono";
import type { Context } from "hono";
import { handle } from "hono/vercel";
import { getCategoryStats } from "../backend/dist/services/report-service.js";

const app = new Hono();

app.use("*", async (c, next) => {
  console.log("[API] /categories path", c.req.path);
  return next();
});

const handleCategories = async (c: Context) => {
  console.log("[API] /categories 请求进入");
  try {
    const stats = await getCategoryStats();
    console.log("[API] /categories 成功返回", stats.length, "个分类");
    return c.json({ success: true, data: stats });
  } catch (error) {
    console.error("[API] /categories 查询失败", error);
    return c.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "分类统计查询失败，请稍后再试",
      },
      500,
    );
  }
};

app.get("/", handleCategories);
app.get("/categories", handleCategories);

export default handle(app);
