import { prisma } from './lib/prisma.js';

// 查询每个分类的数据
const categories = ['strategy', 'macro', 'industry', 'stock'];

for (const category of categories) {
  const count = await prisma.report.count({
    where: { category }
  });

  const latest = await prisma.report.findFirst({
    where: { category },
    orderBy: { date: 'desc' },
    select: { title: true, date: true, org: true }
  });

  console.log(`\n📊 ${category.toUpperCase()}`);
  console.log(`   总数: ${count}`);
  if (latest) {
    console.log(`   最新: ${latest.title}`);
    console.log(`   日期: ${latest.date}`);
    console.log(`   机构: ${latest.org}`);
  }
}

await prisma.$disconnect();
