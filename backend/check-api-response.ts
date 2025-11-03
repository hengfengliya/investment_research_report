import axios from 'axios';
import * as cheerio from 'cheerio';

// 测试抓取一条数据，看看 API 返回的日期格式是什么

const response = await axios.get<string>(
  'https://reportapi.eastmoney.com/report/list',
  {
    params: {
      cb: 'test',
      pageSize: 1,
      pageNo: 1,
      beginTime: '2025-10-29',
      endTime: '2025-10-30',
      fields: '',
      qType: 1,
      industryCode: '*',
      industry: '*',
      rating: '',
      ratingChange: '',
      code: '*'
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  }
);

console.log('API 原始响应:');
console.log(response.data.substring(0, 500));

// 解析 JSONP
const match = response.data.match(/^[^(]+\((.*)\)\s*;?$/s);
if (match) {
  const data = JSON.parse(match[1]);
  console.log('\n解析后的数据（前 1 条）:');
  if (data.data && data.data.length > 0) {
    const record = data.data[0];
    console.log(JSON.stringify(record, null, 2));
    console.log('\npublishDate 的值和类型:');
    console.log(`  值: ${record.publishDate}`);
    console.log(`  类型: ${typeof record.publishDate}`);
  }
}
