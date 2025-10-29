import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import type { ReportFilter } from "../types/report.js";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const buildWhere = (filter: ReportFilter): Prisma.ReportWhereInput => {
  const where: Prisma.ReportWhereInput = {};

  if (filter.category) {
    where.category = filter.category;
  }

  if (filter.org) {
    where.org = { contains: filter.org, mode: "insensitive" };
  }

  if (filter.author) {
    where.author = { contains: filter.author, mode: "insensitive" };
  }

  if (filter.industry) {
    where.industry = { contains: filter.industry, mode: "insensitive" };
  }

  if (filter.rating) {
    where.rating = { contains: filter.rating, mode: "insensitive" };
  }

  if (filter.keyword) {
    where.OR = [
      { title: { contains: filter.keyword, mode: "insensitive" } },
      { summary: { contains: filter.keyword, mode: "insensitive" } },
      { topicTags: { has: filter.keyword } },
    ];
  }

  if (filter.startDate || filter.endDate) {
    where.date = {};
    if (filter.startDate) {
      where.date.gte = new Date(filter.startDate);
    }
    if (filter.endDate) {
      where.date.lte = new Date(filter.endDate);
    }
  }

  return where;
};

const buildOrderBy = (
  sort: ReportFilter["sort"],
): Prisma.ReportOrderByWithRelationInput => {
  if (sort === "hot") {
    return { createdAt: "desc" };
  }

  return { date: "desc" };
};

export const listReports = async (filter: ReportFilter) => {
  console.log("[Service] listReports 调用，参数:", filter);
  await prisma.$connect();
  console.log("[Service] listReports 已连接数据库");

  const safePage = Math.max(DEFAULT_PAGE, filter.page ?? DEFAULT_PAGE);
  const requestedSize = filter.pageSize ?? DEFAULT_PAGE_SIZE;
  const safePageSize = Math.min(Math.max(1, requestedSize), MAX_PAGE_SIZE);

  const where = buildWhere(filter);
  const orderBy = buildOrderBy(filter.sort);

  console.log("[Service] listReports 查询条件:", { where, orderBy, safePage, safePageSize });

  const [total, items] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      orderBy,
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    }),
  ]);

  console.log("[Service] listReports 查询结束，总量:", total);

  return {
    items,
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages: Math.ceil(total / safePageSize) || 1,
  };
};

export const getReportById = async (id: number) => {
  console.log("[Service] getReportById", id);
  await prisma.$connect();
  return prisma.report.findUnique({ where: { id } });
};

export const getCategoryStats = async () => {
  console.log("[Service] getCategoryStats 调用");
  await prisma.$connect();

  const categories = await prisma.report.groupBy({
    by: ["category"],
    _count: { category: true },
  });

  console.log("[Service] getCategoryStats 查询结束，分类数量:", categories.length);

  return categories.map((item) => ({
    category: item.category,
    count: item._count.category,
  }));
};

