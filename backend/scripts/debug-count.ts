import { prisma } from "../lib/prisma";

/**
 * 调试脚本：输出当前数据库中的研报数量，方便确认同步结果。
 */
async function main() {
  const count = await prisma.report.count();
  console.log(`当前数据库中的研报数量：${count}`);
}

main()
  .catch((error) => {
    console.error("统计失败：", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
