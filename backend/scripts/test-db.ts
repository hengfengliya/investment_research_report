#!/usr/bin/env bun

/**
 * 测试脚本：只测试数据库插入/更新操作
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

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

import { prisma } from "../lib/prisma.js";

console.log("\n=== 诊断脚本：测试数据库操作 ===\n");

const testData = {
  title: `测试记录 - ${new Date().getTime()}`,
  category: "strategy" as const,
  org: "测试机构",
  author: "测试作者",
  date: new Date(),
  summary: "这是一条测试摘要",
  pdfUrl: null,
  sourceUrl: "https://test.com",
  stockCode: null,
  stockName: null,
  industry: null,
  rating: null,
  ratingChange: null,
  targetPrice: null,
  changePercent: null,
  topicTags: ["测试"],
  impactLevel: null,
  dataSource: "EastMoney" as const,
};

(async () => {
  try {
    console.log("[1] 测试创建新记录...");
    const start1 = Date.now();
    const created = await prisma.report.create({
      data: {
        ...testData,
        createdAt: new Date().toISOString(),
      },
    });
    const time1 = Date.now() - start1;
    console.log(`✓ 创建成功 (${time1}ms)，ID: ${created.id}\n`);

    console.log("[2] 测试更新记录...");
    const start2 = Date.now();
    const updated = await prisma.report.update({
      where: { id: created.id },
      data: {
        ...testData,
        summary: "更新后的摘要",
      },
    });
    const time2 = Date.now() - start2;
    console.log(`✓ 更新成功 (${time2}ms)\n`);

    console.log("[3] 测试查询...");
    const start3 = Date.now();
    const found = await prisma.report.findUnique({
      where: { id: created.id },
    });
    const time3 = Date.now() - start3;
    console.log(`✓ 查询成功 (${time3}ms)\n`);

    console.log("[4] 清理测试数据...");
    const start4 = Date.now();
    await prisma.report.delete({
      where: { id: created.id },
    });
    const time4 = Date.now() - start4;
    console.log(`✓ 删除成功 (${time4}ms)\n`);

    console.log("✓ 所有数据库操作正常\n");
    process.exit(0);
  } catch (error) {
    console.error("✗ 数据库操作失败:");
    console.error(error);
    process.exit(1);
  }
})();
