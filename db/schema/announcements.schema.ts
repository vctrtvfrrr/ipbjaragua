import { date, integer, pgTable, text } from 'drizzle-orm/pg-core'
import { deletedAt, id, timestamps } from './common-fields'
import { featuredImages } from './featured-images.schema'

export const announcements = pgTable('announcements', {
  id: id(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  url: text('url'),
  icon: text('icon').notNull().default('Pin'),
  featured_image_id: integer('featured_image_id').references(() => featuredImages.id, { onDelete: 'set null' }),
  expires_at: date('expires_at', { mode: 'date' }).notNull(),
  ...timestamps(),
  ...deletedAt(),
})
