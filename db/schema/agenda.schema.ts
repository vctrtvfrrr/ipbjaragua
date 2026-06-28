import { boolean, date, integer, pgTable, text, time } from 'drizzle-orm/pg-core'
import { deletedAt, id, timestamps } from './common-fields'

export const agenda = pgTable('agenda', {
  id: id(),
  title: text('title').notNull(),
  description: text('description'),
  weekday: integer('weekday'),
  time: time('time'),
  is_recurring: boolean('is_recurring').notNull(),
  event_date: date('event_date', { mode: 'date' }),
  ...timestamps(),
  ...deletedAt(),
})
