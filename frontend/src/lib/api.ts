import type {
  CategoryStat,
  ReportCategory,
  ReportFilter,
  ReportListResponse,
} from "@shared-types/report";

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
  "/api";

// 将过滤条件对象转成查询字符串
const buildQueryString = (params: Record<string, unknown>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.append(key, String(value));
  });
  return query.toString();
};

// 通用 GET 请求封装，默认抛出异常提示
const get = async <T>(path: string, params?: Record<string, unknown>) => {
  const search = params ? `?${buildQueryString(params)}` : "";
  const response = await fetch(`${API_BASE}${path}${search}`);

  if (!response.ok) {
    throw new Error("服务响应异常，请稍后再试");
  }

  const payload = (await response.json()) as { success: boolean; data: T };
  if (!payload.success) {
    throw new Error("服务返回失败，请检查参数或稍后再试");
  }

  return payload.data;
};

export const getReports = async (
  filters: ReportFilter,
): Promise<ReportListResponse> => {
  const { category, ...rest } = filters;
  const params = { ...rest } as Record<string, unknown>;
  if (category && category !== "all") {
    params.category = category;
  }
  return get<ReportListResponse>("/reports", params);
};

export const getCategoryStats = async (): Promise<CategoryStat[]> => {
  return get<CategoryStat[]>("/categories");
};

export const triggerSync = async (key: string) => {
  const response = await fetch(`${API_BASE}/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ key }),
  });

  if (!response.ok) {
    throw new Error("触发同步失败，请检查密钥");
  }

  const payload = (await response.json()) as {
    success: boolean;
    data?: unknown;
    message?: string;
  };

  if (!payload.success) {
    throw new Error(payload.message ?? "同步任务执行失败");
  }

  return payload.data;
};
