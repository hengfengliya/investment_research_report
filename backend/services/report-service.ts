import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { ReportFilter } from "../types/report";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/**
 * 将用户传入的筛选条件整理成 Prisma 可以理解�?where 子句�? */
const buildWhere = (filter: ReportFilter): Prisma.ReportWhereInput => {
  const where: Prisma.ReportWhereInput = {};

  if (filter.category) {
    // 筛选指定的研报类型，比�?stock、macro 等�?    where.category = filter.category;
  }

  if (filter.org) {
    // 机构名称模糊匹配，忽略大小写�?    where.org = { contains: filter.org, mode: "insensitive" };
  }

  if (filter.author) {
    // 作者同样采用模糊匹配，方便用户使用关键字查找�?    where.author = { contains: filter.author, mode: "insensitive" };
  }

  if (filter.industry) {
    // 行业字段多出现在行业/个股报告中，这里同样用模糊匹配�?    where.industry = { contains: filter.industry, mode: "insensitive" };
  }

  if (filter.rating) {
    // 投资评级（如“买入”“增持”）�?    where.rating = { contains: filter.rating, mode: "insensitive" };
  }

  if (filter.keyword) {
    // 关键词匹配标题、摘要以及主题标签三个维度�?    where.OR = [
      { title: { contains: filter.keyword, mode: "insensitive" } },
      { summary: { contains: filter.keyword, mode: "insensitive" } },
      { topicTags: { has: filter.keyword } },
    ];
  }

  if (filter.startDate || filter.endDate) {
    // 处理日期区间，startDate/endDate 采用闭区间�?    where.date = {};
    if (filter.startDate) {
      where.date.gte = new Date(filter.startDate);
    }
    if (filter.endDate) {
      where.date.lte = new Date(filter.endDate);
    }
  }

  return where;
};

/**
 * 根据用户的排序选择返回合适的排序规则�? */
const buildOrderBy = (
  sort: ReportFilter["sort"],
): Prisma.ReportOrderByWithRelationInput => {
  if (sort === "hot") {
    // 目前没有热度字段，先预留为按 createdAt 降序�?    return { createdAt: "desc" };
  }
  // 默认按发布日期由近到远排列�?  return { date: "desc" };
};

/**
 * 获取研报列表，并返回分页信息�? */
export const listReports = async (filter: ReportFilter) => {
  const safePage = Math.max(DEFAULT_PAGE, filter.page ?? DEFAULT_PAGE);
  const requestedSize = filter.pageSize ?? DEFAULT_PAGE_SIZE;
  const safePageSize = Math.min(Math.max(1, requestedSize), MAX_PAGE_SIZE);

  const where = buildWhere(filter);
  const orderBy = buildOrderBy(filter.sort);

  // 并行执行总数统计和列表查询，提高响应速度�?  const [total, items] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      orderBy,
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    }),
  ]);

  return {
    items,
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages: Math.ceil(total / safePageSize),
  };
};

/**
 * 根据主键查找单条研报�? */
export const getReportById = async (id: number) => {
  return prisma.report.findUnique({ where: { id } });
};

/**
 * 统计每个分类下的研报数量，方便前端展示�? */
export const getCategoryStats = async () => {
  const categories = await prisma.report.groupBy({
    by: ["category"],
    _count: { category: true },
  });

  return categories.map((item) => ({
    category: item.category,
    count: item._count.category,
  }));
};

