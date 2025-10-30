import { Hono } from "hono";
import type { Context } from "hono";
import { handle } from "hono/vercel";
import { syncKeySchema } from "../backend/dist/lib/validators.js";

const app = new Hono();

const handleSync = async (c: Context) => {
  try {
    const body = await c.req.json();
    const payload = syncKeySchema.parse(body);
    const secret = process.env.SYNC_SECRET;
    if (!secret || payload.key !== secret) {
      return c.json({ success: false, message: "同步密钥错误" }, 401);
    }

    const { runSyncOnce } = await import("../backend/dist/scripts/sync-runner.js");
    const summary = await runSyncOnce();

    return c.json({ success: true, data: summary });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "同步任务执行失败";
    return c.json({ success: false, message }, 400);
  }
};

app.post("/", handleSync);
app.post("/sync", handleSync);

export default handle(app);
