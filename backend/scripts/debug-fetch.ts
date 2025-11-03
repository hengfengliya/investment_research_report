#!/usr/bin/env bun

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// 自动加载 .env
const __filename = fileURLToPath(import.meta.url);
const projectRoot = resolve(dirname(__filename), "../..");
const envPath = resolve(projectRoot, ".env");

try {
  if (process.env.DATABASE_URL === undefined) {
    const envContent = readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        const value = valueParts.join("=");
        if (key && value) {
          const cleanKey = key.trim();
          const cleanValue = value.trim().replace(/^["']|["']$/g, "");
          if (!process.env[cleanKey]) {
            process.env[cleanKey] = cleanValue;
          }
        }
      }
    });
  }
} catch {
  // .env 文件不存在或无法读取
}

import type { ReportCategory } from "./category-config.js";
import { fetchCategoryListInRange } from "./fetch-list.js";

const CATEGORY_SEQUENCE: ReportCategory[] = [
  "strategy",
  "macro",
  "industry",
  "stock",
];

// 脚本入口
const startDate = process.argv[2];
const endDate = process.argv[3];

if (!startDate || !endDate) {
  console.error("用法: bun run ./scripts/debug-fetch.ts <start-date> <end-date>");
  console.error("例如: bun run ./scripts/debug-fetch.ts 2025-01-01 2025-01-31");
  process.exit(1);
}

console.log(`\n=== 调试 API 响应 ===`);
console.log(`日期范围: ${startDate} 至 ${endDate}\n`);

(async () => {
  for (const category of CATEGORY_SEQUENCE) {
    console.log(`\n[${category}] 正在查询...`);
    try {
      const data = await fetchCategoryListInRange<Record<string, unknown>>(
        category,
        startDate,
        endDate,
      );
      console.log(`✓ 获取 ${data.length} 条数据`);

      if (data.length > 0) {
        console.log(`  - 第一条: ${String(data[0].title).substring(0, 50)}`);
        console.log(`  - 发布日期: ${data[0].publishDate}`);
        console.log(`  - 最后一条: ${String(data[data.length - 1].title).substring(0, 50)}`);
        console.log(`  - 发布日期: ${data[data.length - 1].publishDate}`);

        // 统计日期分布
        const dateMap = new Map<string, number>();
        data.forEach((item) => {
          const date = String(item.publishDate).substring(0, 10);
          dateMap.set(date, (dateMap.get(date) ?? 0) + 1);
        });

        console.log(`  - 日期分布:`);
        Array.from(dateMap.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .forEach(([date, count]) => {
            console.log(`    ${date}: ${count} 条`);
          });
      }
    } catch (error) {
      console.error(`✗ 查询失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  process.exit(0);
})();
