import { Hono } from "hono";
import { handle } from "hono/vercel";
import { listReports } from "../backend/dist/services/report-service.js";
import { listQuerySchema } from "../backend/dist/lib/validators.js";

const app = new Hono();

/**
 * GET /api/reports
 * ���ã�����ɸѡ���������б��б�
 */
app.get(async (c) => {
  console.log("[API] /reports ���", c.req.query());
  try {
    const query = listQuerySchema.parse(c.req.query());
    const data = await listReports(query);
    console.log("[API] /reports �ɹ�����", data.items.length, "��");
    return c.json({ success: true, data });
  } catch (error) {
    console.error("[API] /reports ����ʧ��", error);
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
 * Vercel Ҫ�󵼳�һ�� handle ����������������
 */
export default handle(app);
