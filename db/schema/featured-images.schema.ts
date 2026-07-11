import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { id } from './common-fields'

export const featuredImages = pgTable('featured_images', {
  id: id(),
  path: text('path').notNull().unique(),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
})
