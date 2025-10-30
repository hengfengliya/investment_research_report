import { Hono } from "hono";
import { handle } from "hono/vercel";
import { getReportById } from "../../backend/dist/services/report-service.js";

const app = new Hono();

app.get("/", async (c) => {
  const rawId = c.req.param("id");
  const id = Number.parseInt(rawId ?? "", 10);
  if (Number.isNaN(id)) {
    return c.json({ success: false, message: "研报编号不正确" }, 400);
  }

  const report = await getReportById(id);

  if (!report) {
    return c.json({ success: false, message: "未找到对应研报" }, 404);
  }

  return c.json({ success: true, data: report });
});

export default handle(app);
