import { Hono } from "hono";
import type { Context } from "hono";
import { handle } from "hono/vercel";
import { listReports } from "../backend/dist/services/report-service.js";
import { listQuerySchema } from "../backend/dist/lib/validators.js";

const app = new Hono();

app.use("*", async (c, next) => {
  console.log("[API] /reports path", c.req.path, c.req.query());
  return next();
});

const handleReports = async (c: Context) => {
  console.log("[API] /reports 入参", c.req.query());
  try {
    const query = listQuerySchema.parse(c.req.query());
    const data = await listReports(query);
    console.log("[API] /reports 成功返回", data.items.length, "条");
    const response = c.json({ success: true, data });
    console.log("[API] /reports 响应结束");

    // 导入 prisma 实例，在响应后异步断开连接
    const { prisma } = await import("../backend/dist/lib/prisma.js");
    prisma.$disconnect().catch(() => {});
    console.log("[API] /reports 已触发 Prisma 断开连接");

    return response;
  } catch (error) {
    console.error("[API] /reports 调用失败", error);
    return c.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "列表查询失败，请稍后再试",
      },
      400,
    );
  }
};

app.get("/", handleReports);
app.get("/reports", handleReports);

export default handle(app);
