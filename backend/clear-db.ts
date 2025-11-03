import { prisma } from './lib/prisma.js';

console.log('清空数据库中的所有报告...\n');

const deleteResult = await prisma.report.deleteMany({});
console.log(`✅ 成功删除 ${deleteResult.count} 条记录\n`);

// 验证删除成功
const count = await prisma.report.count();
console.log(`验证: 当前数据库中的报告总数: ${count}`);

if (count === 0) {
  console.log('✅ 数据库已完全清空\n');
} else {
  console.log(`❌ 警告：数据库中仍有 ${count} 条记录\n`);
}

await prisma.$disconnect();
