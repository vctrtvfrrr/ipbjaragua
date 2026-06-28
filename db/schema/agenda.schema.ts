import { boolean, integer, pgTable, text } from 'drizzle-orm/pg-core'
import { deletedAt, id, timestamps } from './common-fields'

export const agenda = pgTable('agenda', {
  id: id(),
  title: text('title').notNull(),
  description: text('description'),
  weekday: integer('weekday'),
  time: text('time'),
  is_recurring: boolean('is_recurring').notNull(),
  event_date: text('event_date'),
  ...timestamps(),
  ...deletedAt(),
})
