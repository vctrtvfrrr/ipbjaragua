import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { deletedAt, id, timestamps } from './common-fields';

export const articles = sqliteTable('articles', {
  id: id(),
  title: text('title').notNull(),
  author: text('author'),
  date: text('date').notNull(),
  content: text('content').notNull(),
  ...timestamps(),
  ...deletedAt(),
});
