#!/usr/bin/env bun

/**
 * 诊断脚本：监测同步过程中的卡顿
 * 添加详细的错误日志和超时警告
 */

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
import { fetchDetailInfo, resolveDetailUrl } from "./detail-parser.js";

// 测试参数
const startDate = process.argv[2] || "2025-01-01";
const endDate = process.argv[3] || "2025-01-05";
const testCategory: ReportCategory = "strategy";
const maxRecords = Number(process.argv[4]) || 10; // 只测试前 10 条

console.log(`\n=== 诊断脚本：测试单个分类的处理 ===`);
console.log(`日期范围: ${startDate} 至 ${endDate}`);
console.log(`分类: ${testCategory}`);
console.log(`最多测试: ${maxRecords} 条记录\n`);

(async () => {
  try {
    console.log(`[1] 从 API 查询数据...`);
    const list = await fetchCategoryListInRange<Record<string, unknown>>(
      testCategory,
      startDate,
      endDate,
    );
    console.log(`✓ 获取 ${list.length} 条数据\n`);

    const testList = list.slice(0, maxRecords);
    console.log(`[2] 测试抓取前 ${testList.length} 条记录的详情页...\n`);

    for (let i = 0; i < testList.length; i++) {
      const record = testList[i];
      const title = String(record.title ?? "").substring(0, 50);

      try {
        const startTime = Date.now();
        console.log(`  [${i + 1}/${testList.length}] "${title}"`);
        console.log(`       正在抓取详情页...`);

        const detail = await fetchDetailInfo(testCategory, record);
        const elapsed = Date.now() - startTime;

        console.log(`       ✓ 完成 (${elapsed}ms)`);
        console.log(`       - 摘要长度: ${detail.summary?.length ?? 0} 字`);
        console.log(`       - PDF URL: ${detail.pdfUrl ? "✓" : "✗"}`);
        console.log(`       - 标签数: ${detail.topicTags?.length ?? 0}`);
      } catch (error) {
        const elapsed = Date.now() - Date.now();
        const message = error instanceof Error ? error.message : String(error);
        console.error(`       ✗ 失败: ${message}`);
        console.error(`       详细错误:`);
        console.error(error);
      }
      console.log();
    }

    console.log(`[3] 诊断完成\n`);
    process.exit(0);
  } catch (error) {
    console.error("诊断失败:", error);
    process.exit(1);
  }
})();
