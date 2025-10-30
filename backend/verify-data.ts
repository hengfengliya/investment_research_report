import { prisma } from './lib/prisma.js';

console.log('📈 数据抓取验证报告\n');
console.log('=' .repeat(60));

// 总体统计
const total = await prisma.report.count();
console.log(`\n✅ 数据库总记录数: ${total}\n`);

// 按分类统计
const categories = ['strategy', 'macro', 'industry', 'stock'];
let totalByCategory = 0;

console.log('按分类统计:');
console.log('-'.repeat(60));

for (const category of categories) {
  const count = await prisma.report.count({ where: { category } });
  totalByCategory += count;
  const percentage = ((count / total) * 100).toFixed(1);
  console.log(`${category.padEnd(10)} | 数量: ${String(count).padStart(3)} | 占比: ${percentage}%`);
}

console.log('-'.repeat(60));
console.log(`合计: ${totalByCategory}\n`);

// 按机构统计（Top 10）
console.log('数据来源 Top 10:');
console.log('-'.repeat(60));

const topOrgs = await prisma.report.groupBy({
  by: ['org'],
  _count: true,
  orderBy: {
    _count: {
      org: 'desc'
    }
  },
  take: 10
});

topOrgs.forEach((item, index) => {
  console.log(`${index + 1}. ${item.org.padEnd(20)} | 数量: ${item._count}`);
});

console.log('\n数据日期范围:');
console.log('-'.repeat(60));

const dateRange = await prisma.report.findMany({
  select: { date: true },
  orderBy: [{ date: 'asc' }, { date: 'desc' }],
  take: 1
});

const maxDate = await prisma.report.findFirst({
  orderBy: { date: 'desc' },
  select: { date: true }
});

const minDate = await prisma.report.findFirst({
  orderBy: { date: 'asc' },
  select: { date: true }
});

console.log(`最早日期: ${minDate?.date || 'N/A'}`);
console.log(`最新日期: ${maxDate?.date || 'N/A'}`);

// 检查数据完整性
console.log('\n✓ 数据完整性检查:');
console.log('-'.repeat(60));

const issues = [];

// 检查必填字段
const missingTitle = await prisma.report.count({
  where: { title: { equals: '' } }
});
if (missingTitle > 0) issues.push(`❌ 有 ${missingTitle} 条记录缺少标题`);
else console.log('✓ 所有记录都有标题');

const missingSummary = await prisma.report.count({
  where: { summary: { equals: '' } }
});
if (missingSummary > 0) issues.push(`❌ 有 ${missingSummary} 条记录缺少摘要`);
else console.log('✓ 所有记录都有摘要');

const missingOrg = await prisma.report.count({
  where: { org: { equals: '' } }
});
if (missingOrg > 0) issues.push(`❌ 有 ${missingOrg} 条记录缺少机构`);
else console.log('✓ 所有记录都有机构');

const missingDate = await prisma.report.count({
  where: { date: null }
});
if (missingDate > 0) issues.push(`❌ 有 ${missingDate} 条记录缺少日期`);
else console.log('✓ 所有记录都有日期');

if (issues.length > 0) {
  console.log('\n⚠️ 发现问题:');
  issues.forEach(issue => console.log(issue));
}

console.log('\n' + '='.repeat(60));
console.log('✅ 数据验证完成！');

await prisma.$disconnect();
