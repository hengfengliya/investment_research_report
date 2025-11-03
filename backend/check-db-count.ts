import { prisma } from './lib/prisma.js';

console.log('查询数据库记录数...\n');

const count = await prisma.report.count();
console.log(`当前数据库中的报告总数: ${count}`);

if (count > 0) {
  // 显示最新的 10 条记录
  const latest = await prisma.report.findMany({
    select: {
      id: true,
      title: true,
      date: true,
      createdAt: true,
    },
    orderBy: { date: 'desc' },
    take: 10,
  });

  console.log('\n最新的 10 条记录:\n');
  latest.forEach((report, idx) => {
    console.log(`${idx + 1}. ${report.title.substring(0, 50)}`);
    console.log(`   发布日期: ${report.date.toISOString()}`);
    console.log(`   创建时间: ${report.createdAt.toISOString()}`);
    console.log();
  });
}

await prisma.$disconnect();
