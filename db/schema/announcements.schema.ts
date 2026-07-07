import { date, pgTable, text } from 'drizzle-orm/pg-core'
import { deletedAt, id, timestamps } from './common-fields'

export const announcements = pgTable('announcements', {
  id: id(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  url: text('url'),
  expires_at: date('expires_at', { mode: 'date' }).notNull(),
  ...timestamps(),
  ...deletedAt(),
})
