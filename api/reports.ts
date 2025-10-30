import { Hono } from "hono";
import type { Context } from "hono";
import { handle } from "hono/vercel";
import { db } from "../backend/dist/lib/db.js";
import { reports } from "../backend/dist/lib/schema.js";
import { desc, ilike, or, count, sql } from "drizzle-orm";
import { listQuerySchema } from "../backend/dist/lib/validators.js";

const app = new Hono();

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
    const conditions = [];

    if (query.category && query.category !== 'all') {
      conditions.push(sql`${reports.category} = ${query.category}`);
    }

    if (query.org) {
      conditions.push(sql`${reports.org} ILIKE ${`%${query.org}%`}`);
    }

    if (query.keyword) {
      conditions.push(
        sql`${reports.title} ILIKE ${`%${query.keyword}%`}
            OR ${reports.summary} ILIKE ${`%${query.keyword}%`}`
      );
    }

    // 合并条件（AND 逻辑）
    let query_builder = db.select().from(reports);

    if (conditions.length > 0) {
      // 简化版本：直接使用 SQL where
      for (const condition of conditions) {
        // Drizzle where 不支持这样的写法，我们用分开的方式
      }
    }

    // 使用 Drizzle 构建查询
    let selectQuery = db
      .select()
      .from(reports);

    // 应用过滤条件
    if (query.category && query.category !== 'all') {
      selectQuery = selectQuery.where(
        sql`${reports.category} = ${query.category}`
      );
    }

    if (query.org) {
      selectQuery = selectQuery.where(
        sql`${reports.org} ILIKE ${`%${query.org}%`}`
      );
    }

    if (query.keyword) {
      selectQuery = selectQuery.where(
        sql`${reports.title} ILIKE ${`%${query.keyword}%`}
            OR ${reports.summary} ILIKE ${`%${query.keyword}%`}`
      );
    }

    // 获取总数和分页数据
    const [totalResult, items] = await Promise.all([
      db
        .select({ count: count() })
        .from(reports)
        .where(
          query.category && query.category !== 'all'
            ? sql`${reports.category} = ${query.category}`
            : undefined
        ),
      selectQuery
        .orderBy(desc(reports.date))
        .limit(safePageSize)
        .offset(offset),
    ]);

    const total = totalResult[0]?.count || 0;

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
