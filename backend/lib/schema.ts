import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  real,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// 定义 category 枚举类型
export const categoryEnum = pgEnum('category', [
  'strategy',
  'macro',
  'industry',
  'stock',
]);

// 定义 Report 表
export const reports = pgTable('Report', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  org: text('org'),
  author: text('author'),
  date: timestamp('date', { mode: 'date' }).notNull(),
  summary: text('summary'),
  pdfUrl: text('pdfUrl'),
  sourceUrl: text('sourceUrl').notNull(),
  stockCode: text('stockCode'),
  stockName: text('stockName'),
  industry: text('industry'),
  rating: text('rating'),
  ratingChange: text('ratingChange'),
  targetPrice: real('targetPrice'),
  changePercent: real('changePercent'),
  topicTags: text('topicTags').array().default(sql`ARRAY[]::text[]`),
  impactLevel: text('impactLevel'),
  dataSource: text('dataSource').default('EastMoney'),
  createdAt: timestamp('createdAt', { mode: 'date' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// TypeScript 类型导出
export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;
