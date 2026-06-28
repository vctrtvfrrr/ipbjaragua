import { boolean, date, integer, pgTable, text } from 'drizzle-orm/pg-core'
import { deletedAt, id, timestamps } from './common-fields'
import { articles } from './articles.schema'

export const bulletins = pgTable('bulletins', {
  id: id(),
  title: text('title'),
  date: date('date', { mode: 'date' }).notNull().unique(),
  edition: integer('edition').notNull(),
  article_id: integer('article_id').references(() => articles.id),
  show_announcements: boolean('show_announcements').notNull().default(true),
  show_agenda: boolean('show_agenda').notNull().default(true),
  show_birthdays: boolean('show_birthdays').notNull().default(true),
  agenda_from: date('agenda_from', { mode: 'date' }).notNull(),
  agenda_to: date('agenda_to', { mode: 'date' }).notNull(),
  birthdays_from: date('birthdays_from', { mode: 'date' }).notNull(),
  birthdays_to: date('birthdays_to', { mode: 'date' }).notNull(),
  ...timestamps(),
  ...deletedAt(),
})
