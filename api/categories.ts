import { Hono } from "hono";
import { handle } from "hono/vercel";
import { getCategoryStats } from "../backend/dist/services/report-service.js";

const app = new Hono();

/**
 * GET /api/categories
 * ���ã����ظ���������б�������
 */
app.get(async (c) => {
  console.log("[API] /categories �������");
  try {
    const stats = await getCategoryStats();
    console.log("[API] /categories �ɹ�����", stats.length, "������");
    return c.json({ success: true, data: stats });
  } catch (error) {
    console.error("����ͳ�Ʋ�ѯʧ��", error);
    return c.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "����ͳ�Ʋ�ѯʧ�ܣ����Ժ�����",
      },
      500,
    );
  }
});

export default handle(app);
