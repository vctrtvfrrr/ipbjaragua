import { boolean, integer, pgTable, text } from 'drizzle-orm/pg-core'
import { deletedAt, id, timestamps } from './common-fields'
import { articles } from './articles.schema'

export const bulletins = pgTable('bulletins', {
  id: id(),
  title: text('title'),
  date: text('date').notNull().unique(),
  edition: integer('edition').notNull(),
  article_id: integer('article_id').references(() => articles.id),
  show_announcements: boolean('show_announcements').notNull().default(true),
  show_agenda: boolean('show_agenda').notNull().default(true),
  show_birthdays: boolean('show_birthdays').notNull().default(true),
  agenda_from: text('agenda_from').notNull(),
  agenda_to: text('agenda_to').notNull(),
  birthdays_from: text('birthdays_from').notNull(),
  birthdays_to: text('birthdays_to').notNull(),
  ...timestamps(),
  ...deletedAt(),
})
