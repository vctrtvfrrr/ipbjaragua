import { date, integer, pgTable, text } from 'drizzle-orm/pg-core'
import { users } from './access.schema'
import { featuredImages } from './featured-images.schema'
import { deletedAt, id, timestamps } from './common-fields'

export const articles = pgTable('articles', {
  id: id(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  author_id: integer('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  featured_image_id: integer('featured_image_id').references(() => featuredImages.id, { onDelete: 'set null' }),
  date: date('date', { mode: 'date' }).notNull(),
  excerpt: text('excerpt'),
  content: text('content').notNull(),
  ...timestamps(),
  ...deletedAt(),
})
