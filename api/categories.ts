// 原生 Vercel API Routes - 不使用 Hono 框架
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export default async (req: VercelRequest, res: VercelResponse) => {
  console.log("[API] /categories 请求进入");

  try {
    // 使用 Neon SQL 直接查询
    const categories = await sql(
      `SELECT category, COUNT(*) as count FROM "Report" GROUP BY category`
    );

    const stats = categories.map((item: any) => ({
      category: item.category,
      count: Number(item.count),
    }));

    console.log("[API] /categories 成功返回", stats.length, "个分类");

    console.log("[API] /categories 即将返回响应");

    // 直接返回 JSON（Vercel 原生方式）
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ success: true, data: stats });

    console.log("[API] /categories 响应已发送");
  } catch (error) {
    console.error("[API] /categories 查询失败", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "分类统计查询失败，请稍后再试",
    });
  }
};
