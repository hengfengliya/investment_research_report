import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import type { ReportFilter } from "../types/report.js";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/**
 * ��ɸѡ����ת���� Prisma �Ĳ�ѯ�ṹ��ȷ��ɸѡ�߼����й���
 */
const buildWhere = (filter: ReportFilter): Prisma.ReportWhereInput => {
  const where: Prisma.ReportWhereInput = {};

  if (filter.category) {
    // �����б�����ɸѡ������ strategy��macro��industry��stock��
    where.category = filter.category;
  }

  if (filter.org) {
    // ��������ģ��ƥ�䣬���Դ�Сд�����������������ơ�
    where.org = { contains: filter.org, mode: "insensitive" };
  }

  if (filter.author) {
    // ����ͬ������ģ��ƥ�䣬���ݶ����߻�ͬд����
    where.author = { contains: filter.author, mode: "insensitive" };
  }

  if (filter.industry) {
    // ��ҵ�ֶ���Ҫ��������ҵ����ɱ����У�ͬ��ģ��ƥ�䡣
    where.industry = { contains: filter.industry, mode: "insensitive" };
  }

  if (filter.rating) {
    // Ͷ�������ֶΣ��� �����롱�����֡���ʹ��ģ��ƥ�����㲻ͬ������
    where.rating = { contains: filter.rating, mode: "insensitive" };
  }

  if (filter.keyword) {
    // �ؼ���ͬʱƥ����⡢ժҪ�������ǩ��������ٶ�λ���ݡ�
    where.OR = [
      { title: { contains: filter.keyword, mode: "insensitive" } },
      { summary: { contains: filter.keyword, mode: "insensitive" } },
      { topicTags: { has: filter.keyword } },
    ];
  }

  if (filter.startDate || filter.endDate) {
    // ���췢��ʱ��ı�����ɸѡ��ȷ�����ڹ���׼ȷ��
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
 * �����������������������
 */
const buildOrderBy = (
  sort: ReportFilter["sort"],
): Prisma.ReportOrderByWithRelationInput => {
  if (sort === "hot") {
    // ���ȶȡ���δʵ�֣����ô���ʱ�併����Ϊ�������
    return { createdAt: "desc" };
  }
  // Ĭ�ϰ����б�����ʱ�併�򣬱�֤������������չʾ��
  return { date: "desc" };
};

/**
 * ��ѯ�б��б����ط�ҳ��Ϣ��
 */
export const listReports = async (filter: ReportFilter) => {
  const safePage = Math.max(DEFAULT_PAGE, filter.page ?? DEFAULT_PAGE);
  const requestedSize = filter.pageSize ?? DEFAULT_PAGE_SIZE;
  const safePageSize = Math.min(Math.max(1, requestedSize), MAX_PAGE_SIZE);

  const where = buildWhere(filter);
  const orderBy = buildOrderBy(filter.sort);

  // ����ͳ���������б������Ӧ�ٶȡ�
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
 * ����������ѯ�����б����顣
 */
export const getReportById = async (id: number) => {
  return prisma.report.findUnique({ where: { id } });
};

/**
 * ͳ�Ƹ��б������µ���������ǰ��չʾʹ�á�
 */
export const getCategoryStats = async () => {
  const categories = await prisma.report.groupBy({
    by: ["category"],
    _count: { category: true },
  });

  return categories.map((item: { category: string; _count: { category: number } }) => ({
    category: item.category,
    count: item._count.category,
  }));
};

