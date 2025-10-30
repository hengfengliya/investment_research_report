import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema.js';

// 创建 Neon HTTP 连接
const sql = neon(process.env.DATABASE_URL!);

// 创建 Drizzle 数据库实例（无需管理连接生命周期）
// 直接传递 sql 函数，Drizzle 会自动处理 HTTP 请求
export const db = drizzle(sql, { schema });

console.log('[DB] Drizzle + Neon HTTP 已初始化（无连接池开销）');
