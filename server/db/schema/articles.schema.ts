import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { deletedAt, id, timestamps } from './common-fields';

export const articles = sqliteTable('articles', {
  id: id(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  author: text('author'),
  date: text('date').notNull(),
  excerpt: text('excerpt'),
  content: text('content').notNull(),
  ...timestamps(),
  ...deletedAt(),
});
