import { prisma } from './lib/prisma.js';

console.log('修复数据库中的日期字段...\n');

// 获取所有记录
const reports = await prisma.report.findMany({
  select: { id: true, date: true }
});

console.log(`需要修复的记录数: ${reports.length}\n`);

// 修复逻辑：重新解析日期
const ensureDate = (value: unknown) => {
  const raw = value as string | undefined;
  if (!raw) return new Date();

  // 验证是否为 YYYY-MM-DD 格式
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }

  // 对于 YYYY-MM-DD，创建当天的 UTC 午夜时间
  const [year, month, day] = raw.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};

// 获取需要修复的记录（date 的小时不是 00:00 UTC 的）
const needsFix = reports.filter((r) => {
  const hours = r.date.getUTCHours();
  const minutes = r.date.getUTCMinutes();
  const seconds = r.date.getUTCSeconds();
  // 如果不是 00:00:00 UTC，就需要修复
  return hours !== 0 || minutes !== 0 || seconds !== 0;
});

console.log(`需要修复的错误记录: ${needsFix.length}\n`);

if (needsFix.length > 0) {
  // 修复前后对比
  console.log('修复示例 (前 5 条):\n');
  needsFix.slice(0, 5).forEach((r) => {
    const oldDate = r.date;
    // 从旧日期提取 YYYY-MM-DD
    const dateStr = oldDate.toISOString().split('T')[0];
    const newDate = ensureDate(dateStr);

    console.log(`ID ${r.id}:`);
    console.log(`  修复前: ${oldDate.toISOString()}`);
    console.log(`  修复后: ${newDate.toISOString()}`);
  });

  // 执行修复
  console.log(`\n开始批量修复...`);

  let fixed = 0;
  for (const report of needsFix) {
    const dateStr = report.date.toISOString().split('T')[0];
    const newDate = ensureDate(dateStr);

    await prisma.report.update({
      where: { id: report.id },
      data: { date: newDate }
    });

    fixed++;
    if (fixed % 50 === 0) {
      console.log(`  已修复 ${fixed}/${needsFix.length}`);
    }
  }

  console.log(`\n✅ 修复完成！共修复 ${fixed} 条记录\n`);
} else {
  console.log('✅ 所有记录的日期都是正确的！\n');
}

await prisma.$disconnect();
console.log('任务完成。');
