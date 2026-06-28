import { integer, jsonb, pgTable, text } from 'drizzle-orm/pg-core'
import type { LyricsBlock } from '@/lib/song'
import { deletedAt, id, timestamps } from './common-fields'

export const songs = pgTable('songs', {
  id: id(),
  slug: text('slug').unique().notNull(),
  title: text('title').notNull(),
  songwriter: text('songwriter'),
  performer: text('performer'),
  album: text('album'),
  track: integer('track'),
  lyrics: jsonb('lyrics').$type<LyricsBlock[]>(),
  ...timestamps(),
  ...deletedAt(),
})
