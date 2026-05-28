import { sql } from 'drizzle-orm';
import { check, int, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { deletedAt, id, timestamps } from './common-fields';
import { songs } from './songs.schema';

export const liturgies = sqliteTable('liturgies', {
  id: id(),
  date: text('date').notNull(),
  theme: text('theme').notNull(),
  ...timestamps(),
  ...deletedAt(),
});

export const liturgyActs = sqliteTable('liturgy_acts', {
  id: id(),
  liturgy_id: int('liturgy_id')
    .notNull()
    .references(() => liturgies.id),
  position: int('position').notNull(),
  name: text('name').notNull(),
  ...timestamps(),
});

export const liturgyMoments = sqliteTable(
  'liturgy_moments',
  {
    id: id(),
    act_id: int('act_id')
      .notNull()
      .references(() => liturgyActs.id),
    position: int('position').notNull(),
    type: text('type', {
      enum: ['bible_reading', 'song', 'prayer', 'sermon', 'sacrament', 'pastoral_act', 'other'],
    }).notNull(),
    song_id: int('song_id').references(() => songs.id),
    scripture_passages: text('scripture_passages'),
    description: text('description'),
    sermon_speaker: text('sermon_speaker'),
    sermon_theme: text('sermon_theme'),
    sacrament_type: text('sacrament_type', { enum: ['baptism', 'eucharist'] }),
    ...timestamps(),
  },
  (t) => [check('sacrament_type_required', sql`${t.type} <> 'sacrament' OR ${t.sacrament_type} IS NOT NULL`)],
);
