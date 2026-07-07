import { boolean, date, integer, pgTable, text } from 'drizzle-orm/pg-core'
import { id, timestamps } from './common-fields'
import { articles } from './articles.schema'

export const bulletins = pgTable('bulletins', {
  id: id(),
  title: text('title').notNull(),
  date: date('date', { mode: 'date' }).notNull().unique(),
  edition: integer('edition').notNull().unique(),
  article_id: integer('article_id').references(() => articles.id),
  show_announcements: boolean('show_announcements').notNull().default(true),
  show_agenda: boolean('show_agenda').notNull().default(true),
  show_birthdays: boolean('show_birthdays').notNull().default(true),
  ...timestamps(),
})
