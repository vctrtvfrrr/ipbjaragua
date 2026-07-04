import { date, integer, pgTable, text } from 'drizzle-orm/pg-core'
import { users } from './access.schema'
import { deletedAt, id, timestamps } from './common-fields'

export const articles = pgTable('articles', {
  id: id(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  author_id: integer('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  date: date('date', { mode: 'date' }).notNull(),
  excerpt: text('excerpt'),
  content: text('content').notNull(),
  ...timestamps(),
  ...deletedAt(),
})
