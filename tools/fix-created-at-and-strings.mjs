// 修复历史 createdAt 为北京时间，并清理常见中文乱码字符串
// 使用方法：
//   1) 在项目根目录，确保环境变量 `DATABASE_URL` 可用（可从 .env 读取）
//   2) 可选：设置截止时间 `FIX_BEFORE`（默认 2025-10-31T00:00:00）
//   3) 先干跑： `node tools/fix-created-at-and-strings.mjs --dry`
//   4) 确认后： `node tools/fix-created-at-and-strings.mjs --apply`

import { neon } from "@neondatabase/serverless";

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
  console.error("未检测到 DATABASE_URL，请先在环境中设置或加载 .env");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// 仅修复指定日期之前的数据，避免重复迁移导致的二次 +8 小时
const FIX_BEFORE = process.env.FIX_BEFORE ?? "2025-10-31T00:00:00"; // 北京时间 2025-10-31 之前
const isDryRun = process.argv.includes("--dry");
const isApply = process.argv.includes("--apply");
if (!isDryRun && !isApply) {
  console.log("未指定 --dry 或 --apply，默认使用干跑模式");
}

// 常见乱码到中文的映射
const ORG_GARBLED = [
  "δ֪����", // 未知机构 的乱码形态
  "��?????", // 可能的替代乱码形态（保险）
];

const run = async () => {
  console.log("[fix] 开始检查历史数据……\n");

  // 1) 统计需加 +8 小时的记录数
  const [{ count: countNeedingFix }] = await sql(
    `SELECT COUNT(*)::int AS count FROM "Report" WHERE "createdAt" < $1`,
    [FIX_BEFORE],
  );

  console.log(`需要进行“北京时间 +8 小时”修复的记录数: ${countNeedingFix}`);

  // 2) 统计 org 乱码需要修复的记录数
  const [{ count: countOrgGarbled }] = await sql(
    `SELECT COUNT(*)::int AS count FROM "Report" WHERE "org" IS NULL OR TRIM("org") = '' OR "org" = ANY($1::text[])`,
    [ORG_GARBLED],
  );
  console.log(`需要修复 org 中文乱码/空值 的记录数: ${countOrgGarbled}`);

  if (!isApply) {
    console.log("\n[fix] 干跑完成。未对数据库进行修改。");
    console.log("如要执行修复，请追加 --apply，可选设置 FIX_BEFORE=YYYY-MM-DDTHH:mm:ss\n");
    return;
  }

  console.log("\n[fix] 执行修复中……");

  // 3) 执行 createdAt +8 小时（仅限截止日前的历史数据）
  if (countNeedingFix > 0) {
    await sql(
      `UPDATE "Report" SET "createdAt" = "createdAt" + INTERVAL '8 hours' WHERE "createdAt" < $1`,
      [FIX_BEFORE],
    );
    console.log("已完成 createdAt +8 小时修复。");
  } else {
    console.log("无需修复 createdAt（未命中条件）。");
  }

  // 4) 修复 org 中文乱码/空值
  if (countOrgGarbled > 0) {
    await sql(
      `UPDATE "Report" SET "org" = '未知机构' WHERE "org" IS NULL OR TRIM("org") = '' OR "org" = ANY($1::text[])`,
      [ORG_GARBLED],
    );
    console.log("已完成 org 中文乱码/空值 修复。");
  } else {
    console.log("无需修复 org（未命中条件）。");
  }

  console.log("\n[fix] 所有修复已完成。");
};

run().catch((err) => {
  console.error("修复执行失败:", err);
  process.exit(1);
});

