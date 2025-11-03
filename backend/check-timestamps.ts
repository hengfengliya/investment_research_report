import { prisma } from './lib/prisma.js';

// 查看几条记录，看看 date 和 createdAt 的实际值
const reports = await prisma.report.findMany({
  select: {
    id: true,
    title: true,
    date: true,
    createdAt: true
  },
  take: 5
});

console.log('数据库中的时间字段值：\n');
reports.forEach((report, idx) => {
  console.log(`\n记录 ${idx + 1}:`);
  console.log(`  ID: ${report.id}`);
  console.log(`  标题: ${report.title.substring(0, 30)}...`);
  console.log(`  date 字段: ${report.date}`);
  console.log(`  date 类型: ${typeof report.date}`);
  console.log(`  date ISO: ${report.date.toISOString()}`);
  console.log(`  createdAt 字段: ${report.createdAt}`);
  console.log(`  createdAt 类型: ${typeof report.createdAt}`);
  console.log(`  createdAt ISO: ${report.createdAt.toISOString()}`);
});

await prisma.$disconnect();
