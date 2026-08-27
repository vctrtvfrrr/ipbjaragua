import { sql } from 'drizzle-orm'
import { check, date, pgTable, text } from 'drizzle-orm/pg-core'
import { deletedAt, id, timestamps } from './common-fields'

export const announcements = pgTable(
  'announcements',
  {
    id: id(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    url: text('url'),
    icon: text('icon').notNull().default('Pin'),
    flyer_path: text('flyer_path'),
    starts_at: date('starts_at', { mode: 'date' }).notNull(),
    expires_at: date('expires_at', { mode: 'date' }).notNull(),
    ...timestamps(),
    ...deletedAt(),
  },
  (t) => [check('announcements_window_not_inverted', sql`${t.starts_at} <= ${t.expires_at}`)]
)
