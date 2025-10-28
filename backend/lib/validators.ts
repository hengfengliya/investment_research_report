import { z } from "zod";

/**
 * 列表接口的查询参数校验。
 * z.coerce.number() 可以把字符串转成数字，方便直接读取 URL 参数。
 */
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  category: z.string().trim().min(1).optional(),
  keyword: z.string().trim().min(1).optional(),
  org: z.string().trim().min(1).optional(),
  author: z.string().trim().min(1).optional(),
  industry: z.string().trim().min(1).optional(),
  rating: z.string().trim().min(1).optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  sort: z.enum(["date", "hot"]).optional(),
});

/**
 * sync 接口简单用一个密钥做保护，防止被随意调用。
 */
export const syncKeySchema = z.object({
  key: z.string().min(1, "同步密钥不能为空"),
});
