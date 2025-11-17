import { clsx, type ClassValue } from "clsx";

/**
 * 合并 className：使用 clsx 和 tailwindcss 合并类名
 * 支持条件类名、对象、数组等多种格式
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
