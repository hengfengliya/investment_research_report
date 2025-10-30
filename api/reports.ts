import { Hono } from "hono";
import type { Context } from "hono";
import { handle } from "hono/vercel";
import { neon } from "@neondatabase/serverless";
import { listQuerySchema } from "../backend/dist/lib/validators.js";

const app = new Hono();
const sql = neon(process.env.DATABASE_URL!);

app.use("*", async (c, next) => {
  console.log("[API] /reports path", c.req.path, c.req.query());
  return next();
});

const handleReports = async (c: Context) => {
  console.log("[API] /reports 入参", c.req.query());

  try {
    const query = listQuerySchema.parse(c.req.query());

    // 分页参数
    const safePage = Math.max(1, query.page ?? 1);
    const safePageSize = Math.min(Math.max(1, query.pageSize ?? 20), 100);
    const offset = (safePage - 1) * safePageSize;

    // 构建 WHERE 条件
    const whereConditions: string[] = [];
    const whereParams: any[] = [];

    if (query.category && query.category !== 'all') {
      whereConditions.push(`category = $${whereParams.length + 1}`);
      whereParams.push(query.category);
    }

    if (query.org) {
      whereConditions.push(`org ILIKE $${whereParams.length + 1}`);
      whereParams.push(`%${query.org}%`);
    }

    if (query.keyword) {
      const keywordParam = `%${query.keyword}%`;
      whereConditions.push(`(title ILIKE $${whereParams.length + 1} OR summary ILIKE $${whereParams.length + 2})`);
      whereParams.push(keywordParam, keywordParam);
    }

    // 构建 WHERE 子句
    const whereClause = whereConditions.length > 0
      ? ` WHERE ${whereConditions.join(' AND ')}`
      : '';

    // 使用 Neon SQL 直接查询（避免 ORM 类型问题）
    const [totalResult, items] = await Promise.all([
      // 获取总数
      sql(`SELECT COUNT(*) as count FROM "Report"${whereClause}`, whereParams),
      // 获取分页数据
      sql(
        `SELECT * FROM "Report"${whereClause} ORDER BY date DESC LIMIT $${whereParams.length + 1} OFFSET $${whereParams.length + 2}`,
        [...whereParams, safePageSize, offset]
      ),
    ]);

    const total = (totalResult[0] as any)?.count || 0;

    console.log("[API] /reports 查询完成:", total, "条记录，返回", items.length, "条");

    const data = {
      items,
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages: Math.ceil(total / safePageSize) || 1,
    };

    // ✅ 无需 disconnect - HTTP 请求自动清理
    return c.json({ success: true, data });
  } catch (error) {
    console.error("[API] /reports 调用失败", error);
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "列表查询失败，请稍后再试",
      },
      400,
    );
  }
};

app.get("/", handleReports);
app.get("/reports", handleReports);

export default handle(app);
