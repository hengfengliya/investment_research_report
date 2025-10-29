import { serve } from "@hono/node-server";
import { Hono } from "hono";
import {
  getCategoryStats,
  getReportById,
  listReports,
} from "./services/report-service.js";
import { listQuerySchema, syncKeySchema } from "./lib/validators.js";
import { runSyncOnce } from "./scripts/sync-runner.js";

const app = new Hono();

/**
 * �б�ӿڣ�������ѯ�������ɷ���㴦����ͳһ��װ��Ӧ��
 */
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
          error instanceof Error ? error.message : "�б��ѯʧ�ܣ����Ժ�����",
      },
      400,
    );
  }
});

/**
 * ����ӿڣ�У��·�����������ص����б���Ϣ��
 */
app.get("/api/report/:id", async (c) => {
  const rawId = c.req.param("id");
  const id = Number.parseInt(rawId, 10);
  if (Number.isNaN(id)) {
    return c.json({ success: false, message: "�б���Ų���ȷ" }, 400);
  }

  const report = await getReportById(id);
  if (!report) {
    return c.json({ success: false, message: "δ�ҵ���Ӧ�б�" }, 404);
  }

  return c.json({ success: true, data: report });
});

/**
 * ����ͳ�ƽӿڣ�����ǰ�˻��Ʒ��������
 */
app.get("/api/categories", async (c) => {
  const stats = await getCategoryStats();
  return c.json({ success: true, data: stats });
});

/**
 * ͬ���ӿڣ�У����Կ�󴥷�һ��ץȡ����
 */
app.post("/api/sync", async (c) => {
  try {
    const payload = syncKeySchema.parse(await c.req.json());
    const secret = process.env.SYNC_SECRET;

    if (!secret || payload.key !== secret) {
      return c.json({ success: false, message: "ͬ����Կ����" }, 401);
    }

    const summary = await runSyncOnce();
    return c.json({ success: true, data: summary });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "ͬ������ִ��ʧ��";
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
    console.log(`���ط�����������http://localhost:${port}`);
  },
);

