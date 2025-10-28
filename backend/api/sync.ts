import { Hono } from "hono";
import { handle } from "hono/vercel";
import { syncKeySchema } from "../lib/validators";

const app = new Hono();

/**
 * POST /api/sync
 * 作用：触发一次抓取任务。需要提供正确的密钥。
 */
app.post(async (c) => {
  try {
    const body = await c.req.json(); // 读取 JSON 请求体。
    const payload = syncKeySchema.parse(body); // 校验密钥字段。
    const secret = process.env.SYNC_SECRET; // 从环境变量读取真实密钥。

    if (!secret || payload.key !== secret) {
      return c.json({ success: false, message: "同步密钥错误" }, 401);
    }

    // 动态引入脚本，避免在无须同步时占用额外资源。
    const { runSyncOnce } = await import("../scripts/sync-runner");
    const summary = await runSyncOnce();

    return c.json({ success: true, data: summary });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "同步任务执行失败";
    return c.json({ success: false, message }, 400);
  }
});

export default handle(app);
