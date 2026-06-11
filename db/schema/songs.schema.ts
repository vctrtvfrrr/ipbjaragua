import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { deletedAt, id, timestamps } from './common-fields';

export const songs = sqliteTable('songs', {
  id: id(),
  slug: text('slug').unique().notNull(),
  title: text('title').notNull(),
  songwriter: text('songwriter'),
  performer: text('performer'),
  album: text('album'),
  track: int('track'),
  lyrics: text('lyrics'),
  ...timestamps(),
  ...deletedAt(),
});
