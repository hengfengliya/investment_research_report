import { z } from "zod";

/**
 * 列表接口的查询参数校验逻辑，统一限制分页与过滤条件格式。
 * z.coerce.number 可以把字符串自动转换为数字，便于处理 URL 查询字符串。
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
 * 同步接口简单使用密钥校验，避免被外部随意触发。
 */
export const syncKeySchema = z.object({
  key: z.string().min(1, "同步密钥不能为空"),
});
