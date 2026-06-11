import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { deletedAt, id, timestamps } from './common-fields';
import { articles } from './articles.schema';
import { liturgies } from './liturgies.schema';

export const bulletins = sqliteTable('bulletins', {
  id: id(),
  title: text('title'),
  date: text('date').notNull().unique(),
  article_id: int('article_id').references(() => articles.id),
  liturgy_id: int('liturgy_id').references(() => liturgies.id),
  show_announcements: int('show_announcements', { mode: 'boolean' }).notNull().default(true),
  show_agenda: int('show_agenda', { mode: 'boolean' }).notNull().default(true),
  show_birthdays: int('show_birthdays', { mode: 'boolean' }).notNull().default(true),
  agenda_from: text('agenda_from').notNull(),
  agenda_to: text('agenda_to').notNull(),
  birthdays_from: text('birthdays_from').notNull(),
  birthdays_to: text('birthdays_to').notNull(),
  ...timestamps(),
  ...deletedAt(),
});
