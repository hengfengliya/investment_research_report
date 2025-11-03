// 测试日期修复

const ensureDate = (value: unknown) => {
  const raw = value as string | undefined;
  if (!raw) return new Date();

  // 验证是否为 YYYY-MM-DD 格式
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    // 尝试其他格式
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }

  // 对于 YYYY-MM-DD，创建当天的 UTC 午夜时间
  const [year, month, day] = raw.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};

// 测试用例
console.log('日期处理测试:\n');

const testCases = [
  '2025-10-28',
  '2025-10-27',
  '2025-10-30',
  undefined,
  ''
];

testCases.forEach((testCase) => {
  const result = ensureDate(testCase);
  console.log(`输入: ${testCase ?? 'undefined'}`);
  console.log(`  本地时间: ${result.toString()}`);
  console.log(`  ISO 格式: ${result.toISOString()}`);
  console.log(`  只保留日期: ${result.toISOString().split('T')[0]}`);
  console.log();
});
