import { pgTable, text } from 'drizzle-orm/pg-core'
import { deletedAt, id, timestamps } from './common-fields'

export const announcements = pgTable('announcements', {
  id: id(),
  title: text('title').notNull(),
  description: text('description'),
  url: text('url'),
  expires_at: text('expires_at').notNull(),
  ...timestamps(),
  ...deletedAt(),
})
