import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { ReportFilter } from "../types/report";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/**
 * 将筛选条件转换成 Prisma 的查询结构，确保筛选逻辑集中管理。
 */
const buildWhere = (filter: ReportFilter): Prisma.ReportWhereInput => {
  const where: Prisma.ReportWhereInput = {};

  if (filter.category) {
    // 根据研报分类筛选，例如 strategy、macro、industry、stock。
    where.category = filter.category;
  }

  if (filter.org) {
    // 机构名称模糊匹配，忽略大小写，方便搜索部分名称。
    where.org = { contains: filter.org, mode: "insensitive" };
  }

  if (filter.author) {
    // 作者同样采用模糊匹配，兼容多作者或不同写法。
    where.author = { contains: filter.author, mode: "insensitive" };
  }

  if (filter.industry) {
    // 行业字段主要出现在行业或个股报告中，同样模糊匹配。
    where.industry = { contains: filter.industry, mode: "insensitive" };
  }

  if (filter.rating) {
    // 投资评级字段（如 “买入”“增持”）使用模糊匹配满足不同表述。
    where.rating = { contains: filter.rating, mode: "insensitive" };
  }

  if (filter.keyword) {
    // 关键词同时匹配标题、摘要和主题标签，方便快速定位内容。
    where.OR = [
      { title: { contains: filter.keyword, mode: "insensitive" } },
      { summary: { contains: filter.keyword, mode: "insensitive" } },
      { topicTags: { has: filter.keyword } },
    ];
  }

  if (filter.startDate || filter.endDate) {
    // 构造发布时间的闭区间筛选，确保日期过滤准确。
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

/**
 * 根据排序类型生成排序规则。
 */
const buildOrderBy = (
  sort: ReportFilter["sort"],
): Prisma.ReportOrderByWithRelationInput => {
  if (sort === "hot") {
    // “热度”暂未实现，先用创建时间降序作为替代规则。
    return { createdAt: "desc" };
  }
  // 默认按照研报发布时间降序，保证最新内容优先展示。
  return { date: "desc" };
};

/**
 * 查询研报列表并返回分页信息。
 */
export const listReports = async (filter: ReportFilter) => {
  const safePage = Math.max(DEFAULT_PAGE, filter.page ?? DEFAULT_PAGE);
  const requestedSize = filter.pageSize ?? DEFAULT_PAGE_SIZE;
  const safePageSize = Math.min(Math.max(1, requestedSize), MAX_PAGE_SIZE);

  const where = buildWhere(filter);
  const orderBy = buildOrderBy(filter.sort);

  // 并行统计总数与列表，提高响应速度。
  const [total, items] = await Promise.all([
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
    totalPages: Math.ceil(total / safePageSize) || 1,
  };
};

/**
 * 根据主键查询单条研报详情。
 */
export const getReportById = async (id: number) => {
  return prisma.report.findUnique({ where: { id } });
};

/**
 * 统计各研报分类下的数量，供前端展示使用。
 */
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
