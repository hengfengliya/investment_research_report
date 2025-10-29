import { Hono } from "hono";
import { handle } from "hono/vercel";
import { listReports } from "../backend/dist/services/report-service.js";
import { listQuerySchema } from "../backend/dist/lib/validators.js";

const app = new Hono();

/**
 * GET /api/reports
 * 作用：根据筛选条件返回研报列表。
 */
app.get(async (c) => {
  console.log("[API] /reports 入参", c.req.query());
  try {
    const query = listQuerySchema.parse(c.req.query());
    const data = await listReports(query);
    console.log("[API] /reports 成功返回", data.items.length, "条");
    return c.json({ success: true, data });
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
});

/**
 * Vercel 要求导出一个 handle 函数用来处理请求。
 */
export default handle(app);
