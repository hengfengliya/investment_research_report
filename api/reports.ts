import { Hono } from "hono";
import type { Context } from "hono";
import { handle } from "hono/vercel";
import { createPrismaClient } from "../backend/dist/lib/prisma.js";
import { listQuerySchema } from "../backend/dist/lib/validators.js";

const app = new Hono();

app.use("*", async (c, next) => {
  console.log("[API] /reports path", c.req.path, c.req.query());
  return next();
});

const handleReports = async (c: Context) => {
  console.log("[API] /reports 入参", c.req.query());

  // 每次请求创建新的 Prisma 客户端
  const prisma = createPrismaClient();

  try {
    const query = listQuerySchema.parse(c.req.query());

    // 直接调用 Prisma 查询
    const safePage = Math.max(1, query.page ?? 1);
    const safePageSize = Math.min(Math.max(1, query.pageSize ?? 20), 100);
    const where: any = {};

    if (query.category && query.category !== 'all') {
      where.category = query.category;
    }
    if (query.org) {
      where.org = { contains: query.org, mode: 'insensitive' };
    }
    if (query.keyword) {
      where.OR = [
        { title: { contains: query.keyword, mode: 'insensitive' } },
        { summary: { contains: query.keyword, mode: 'insensitive' } }
      ];
    }

    const [total, items] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (safePage - 1) * safePageSize,
        take: safePageSize,
      }),
    ]);

    console.log("[API] /reports 查询完成:", total, "条记录，返回", items.length, "条");

    const data = {
      items,
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages: Math.ceil(total / safePageSize) || 1,
    };

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
  } finally {
    // 确保在 finally 块中断开连接
    await prisma.$disconnect();
    console.log("[API] /reports Prisma 客户端已释放");
  }
};

app.get("/", handleReports);
app.get("/reports", handleReports);

export default handle(app);
