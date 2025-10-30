import { Hono } from "hono";
import type { Context } from "hono";
import { handle } from "hono/vercel";
import { getReportById } from "../../backend/dist/services/report-service.js";

const app = new Hono();

app.use("*", async (c, next) => {
  console.log("[API] /report/[id] path", c.req.path);
  return next();
});

const handleReport = async (c: Context) => {
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
};

app.get("/:id", handleReport);
app.get("/report/:id", handleReport);

export default handle(app);
