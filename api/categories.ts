import { Hono } from "hono";
import type { Context } from "hono";
import { handle } from "hono/vercel";
import { createPrismaClient } from "../backend/dist/lib/prisma.js";

const app = new Hono();

app.use("*", async (c, next) => {
  console.log("[API] /categories path", c.req.path);
  return next();
});

const handleCategories = async (c: Context) => {
  console.log("[API] /categories 请求进入");

  // 每次请求创建新的 Prisma 客户端
  const prisma = createPrismaClient();

  try {
    const categories = await prisma.report.groupBy({
      by: ["category"],
      _count: { category: true },
    });

    const stats = categories.map((item) => ({
      category: item.category,
      count: item._count.category,
    }));

    console.log("[API] /categories 成功返回", stats.length, "个分类");
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
  } finally {
    // 确保在 finally 块中断开连接
    await prisma.$disconnect();
    console.log("[API] /categories Prisma 客户端已释放");
  }
};

app.get("/", handleCategories);
app.get("/categories", handleCategories);

export default handle(app);
