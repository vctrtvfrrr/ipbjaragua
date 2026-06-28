import { date, pgTable, text } from 'drizzle-orm/pg-core'
import { deletedAt, id, timestamps } from './common-fields'

export const articles = pgTable('articles', {
  id: id(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  author: text('author'),
  date: date('date', { mode: 'date' }).notNull(),
  excerpt: text('excerpt'),
  content: text('content').notNull(),
  ...timestamps(),
  ...deletedAt(),
})
