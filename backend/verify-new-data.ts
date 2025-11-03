import { prisma } from './lib/prisma.js';

console.log('✅ 新抓取数据的日期验证\n');
console.log('='.repeat(80));

// 查看新抓取的数据
const reports = await prisma.report.findMany({
  select: {
    id: true,
    title: true,
    date: true,
    createdAt: true,
    category: true
  },
  take: 10,
  orderBy: { date: 'desc' }
});

console.log('\n新抓取的数据（前 10 条）:\n');

reports.forEach((report, idx) => {
  console.log(`${idx + 1}. ${report.title.substring(0, 40).padEnd(40)}`);
  console.log(`   分类: ${report.category.padEnd(8)} | 日期: ${report.date.toISOString().split('T')[0]}`);
  console.log(`   date ISO: ${report.date.toISOString()}`);
  console.log(`   createdAt: ${report.createdAt.toISOString()}`);

  // 检查日期是否符合预期（应该是 00:00:00 UTC）
  const hours = report.date.getUTCHours();
  const minutes = report.date.getUTCMinutes();
  const seconds = report.date.getUTCSeconds();

  if (hours === 0 && minutes === 0 && seconds === 0) {
    console.log(`   ✅ 日期正确（UTC 午夜）`);
  } else {
    console.log(`   ❌ 日期错误（UTC 时间：${hours}:${minutes}:${seconds}）`);
  }
  console.log();
});

console.log('='.repeat(80));

// 统计日期分布
const dateStats = await prisma.report.groupBy({
  by: ['date'],
  _count: true,
  orderBy: { date: 'desc' }
});

console.log('\n按日期统计:\n');
dateStats.forEach((stat) => {
  const dateStr = stat.date.toISOString().split('T')[0];
  console.log(`${dateStr}: ${stat._count} 条`);
});

await prisma.$disconnect();
