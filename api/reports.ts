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
  try {
    // 将查询参数取出并用 zod 做校验，避免非法输入。
    const query = listQuerySchema.parse(c.req.query());
    const data = await listReports(query);
    return c.json({ success: true, data });
  } catch (error) {
    // 如果校验失败或查询报错，这里返回友好的提示。
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
