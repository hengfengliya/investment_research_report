/**
 * 触发 Vercel 部署的同步接口，抓取研报数据到数据库
 * 使用方法：node trigger-sync.js
 */

const VERCEL_URL = process.env.VERCEL_URL || 'https://investment-research-report.vercel.app';
const SYNC_SECRET = 'demo-secret-key';

async function triggerSync() {
  console.log('🚀 开始触发数据同步...');
  console.log(`📍 API 地址: ${VERCEL_URL}/api/sync`);

  try {
    const response = await fetch(`${VERCEL_URL}/api/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key: SYNC_SECRET }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ 同步成功！');
      console.log('\n📊 同步统计：');
      console.log(`- 总计抓取: ${result.data.totalFetched} 条`);
      console.log(`- 新增插入: ${result.data.totalInserted} 条`);
      console.log(`- 更新记录: ${result.data.totalUpdated} 条`);
      console.log(`- 失败记录: ${result.data.totalErrors} 条`);

      if (result.data.categories && result.data.categories.length > 0) {
        console.log('\n📂 各分类详情：');
        result.data.categories.forEach(cat => {
          console.log(`  ${cat.category}: 抓取 ${cat.fetched} 条，插入 ${cat.inserted} 条，更新 ${cat.updated} 条`);
        });
      }
    } else {
      console.error('❌ 同步失败：', result.message || '未知错误');
      console.error('响应详情：', result);
    }
  } catch (error) {
    console.error('❌ 请求失败：', error.message);
    console.error('错误详情：', error);
  }
}

// 执行同步
triggerSync();
