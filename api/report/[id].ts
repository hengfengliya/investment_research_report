// 原生 Vercel API Routes - 与其他 API 保持一致的实现方式
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export default async (req: VercelRequest, res: VercelResponse) => {
  // 从 URL 路径中提取 ID
  const { id: rawId } = req.query;
  console.log("[API] /report/[id] 请求进入", { rawId, path: req.url });

  // 验证 ID 参数
  const id = Number.parseInt(rawId as string, 10);
  if (Number.isNaN(id)) {
    console.error("[API] /report/[id] ID 参数无效:", rawId);
    return res.status(400).json({
      success: false,
      message: "研报编号不正确"
    });
  }

  try {
    console.log("[API] /report/[id] 开始查询 ID:", id);

    // 使用 Neon SQL 直接查询
    const reports = await sql(
      `SELECT * FROM "Report" WHERE id = $1 LIMIT 1`,
      [id]
    );

    console.log("[API] /report/[id] 查询完成，结果数:", reports.length);

    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: "未找到对应研报"
      });
    }

    const report = reports[0];

    // 直接返回 JSON
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error("[API] /report/[id] 查询失败", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "查询失败，请稍后再试"
    });
  }
};
