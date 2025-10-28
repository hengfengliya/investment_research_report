import { Hono } from "hono";
import { handle } from "hono/vercel";
import { getReportById } from "../../services/report-service";

const app = new Hono();

/**
 * GET /api/report/:id
 * 作用：获取单条研报的详细信息。
 */
app.get(async (c) => {
  const rawId = c.req.param("id"); // 从路径中读取研报的 id。
  const id = Number.parseInt(rawId, 10); // 将字符串转换为数字。

  if (Number.isNaN(id)) {
    // 如果路径不是数字，这里直接返回 400 表示请求无效。
    return c.json({ success: false, message: "研报编号不正确" }, 400);
  }

  const report = await getReportById(id);

  if (!report) {
    // 数据库找不到对应的记录时返回 404。
    return c.json({ success: false, message: "未找到对应研报" }, 404);
  }

  return c.json({ success: true, data: report });
});

export default handle(app);
