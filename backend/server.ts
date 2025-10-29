import { serve } from "@hono/node-server";
import { Hono } from "hono";
import {
  getCategoryStats,
  getReportById,
  listReports,
} from "./services/report-service";
import { listQuerySchema, syncKeySchema } from "./lib/validators";
import { runSyncOnce } from "./scripts/sync-runner";

const app = new Hono();

app.get("/api/reports", async (c) => {
  try {
    const query = listQuerySchema.parse(c.req.query());
    const data = await listReports(query);
    return c.json({ success: true, data });
  } catch (error) {
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

app.get("/api/report/:id", async (c) => {
  const rawId = c.req.param("id");
  const id = Number.parseInt(rawId, 10);
  if (Number.isNaN(id)) {
    return c.json({ success: false, message: "研报编号不正确" }, 400);
  }

  const report = await getReportById(id);
  if (!report) {
    return c.json({ success: false, message: "未找到对应研报" }, 404);
  }

  return c.json({ success: true, data: report });
});

app.get("/api/categories", async (c) => {
  const stats = await getCategoryStats();
  return c.json({ success: true, data: stats });
});

app.post("/api/sync", async (c) => {
  try {
    const payload = syncKeySchema.parse(await c.req.json());
    const secret = process.env.SYNC_SECRET;

    if (!secret || payload.key !== secret) {
      return c.json({ success: false, message: "同步密钥错误" }, 401);
    }

    const summary = await runSyncOnce();
    return c.json({ success: true, data: summary });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "同步任务执行失败";
    return c.json({ success: false, message }, 400);
  }
});

const port = Number.parseInt(process.env.PORT ?? "3000", 10);

serve(
  {
    fetch: app.fetch,
    port,
  },
  () => {
    console.log(`本地服务已启动：http://localhost:${port}`);
  },
);
