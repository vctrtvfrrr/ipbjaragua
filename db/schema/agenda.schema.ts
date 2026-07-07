import { date, pgTable, text, time } from 'drizzle-orm/pg-core'
import { deletedAt, id, timestamps } from './common-fields'

export const agenda = pgTable('agenda', {
  id: id(),
  title: text('title').notNull(),
  description: text('description'),
  time: time('time'),
  event_date: date('event_date', { mode: 'date' }).notNull(),
  ...timestamps(),
  ...deletedAt(),
})
