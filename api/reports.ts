// 原生 Vercel API Routes - 不使用 Hono 框架
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export default async (req: VercelRequest, res: VercelResponse) => {
  console.log("[API] /reports 请求进入", { method: req.method, path: req.url, query: req.query });

  try {
    // 解析查询参数
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(Math.max(1, parseInt(req.query.pageSize as string) || 20), 100);
    const offset = (page - 1) * pageSize;
    const category = req.query.category as string;
    const org = req.query.org as string;
    const keyword = req.query.keyword as string;

    console.log("[API] /reports 入参解析完成:", { page, pageSize, category, org, keyword });

    // 构建 WHERE 条件
    const whereConditions: string[] = [];
    const whereParams: any[] = [];

    if (category && category !== 'all') {
      whereConditions.push(`category = $${whereParams.length + 1}`);
      whereParams.push(category);
    }

    if (org) {
      whereConditions.push(`org ILIKE $${whereParams.length + 1}`);
      whereParams.push(`%${org}%`);
    }

    if (keyword) {
      whereConditions.push(`(title ILIKE $${whereParams.length + 1} OR summary ILIKE $${whereParams.length + 2})`);
      whereParams.push(`%${keyword}%`, `%${keyword}%`);
    }

    const whereClause = whereConditions.length > 0
      ? ` WHERE ${whereConditions.join(' AND ')}`
      : '';

    console.log("[API] /reports 查询构建完成:", { whereClause, whereParams });

    // 执行查询
    const [totalResult, items] = await Promise.all([
      sql(`SELECT COUNT(*) as count FROM "Report"${whereClause}`, whereParams),
      sql(
        `SELECT * FROM "Report"${whereClause} ORDER BY date DESC LIMIT $${whereParams.length + 1} OFFSET $${whereParams.length + 2}`,
        [...whereParams, pageSize, offset]
      ),
    ]);

    const total = (totalResult[0] as any)?.count || 0;

    console.log("[API] /reports 查询完成:", total, "条记录，返回", items.length, "条");

    const data = {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    };

    console.log("[API] /reports 即将返回响应");

    // 直接返回 JSON（Vercel 原生方式）
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ success: true, data });

    console.log("[API] /reports 响应已发送");
  } catch (error) {
    console.error("[API] /reports 调用失败", error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "列表查询失败，请稍后再试",
    });
  }
};
