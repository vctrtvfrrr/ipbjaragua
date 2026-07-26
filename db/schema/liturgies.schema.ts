import { sql } from 'drizzle-orm'
import { check, date, integer, jsonb, pgEnum, pgTable, text, time, unique } from 'drizzle-orm/pg-core'
import { deletedAt, id, timestamps } from './common-fields'
import { songs } from './songs.schema'

export type ScripturePassage = { reference: string | null; text: string | null; version: string | null }

export const momentType = pgEnum('moment_type', [
  'bible_reading',
  'song',
  'prayer',
  'sermon',
  'sacrament',
  'pastoral_act',
  'other',
])

export const sacramentType = pgEnum('sacrament_type', ['baptism', 'eucharist'])
export const liturgyStatus = pgEnum('liturgy_status', ['draft', 'published'])
export type LiturgyStatus = (typeof liturgyStatus.enumValues)[number]

export const liturgies = pgTable(
  'liturgies',
  {
    id: id(),
    date: date('date', { mode: 'date' }).notNull(),
    theme: text('theme').notNull(),
    time: time('time').notNull(),
    description: text('description'),
    status: liturgyStatus('status').notNull().default('draft'),
    ...timestamps(),
    ...deletedAt(),
  },
  (t) => [unique('liturgies_date_theme_time_unique').on(t.date, t.theme, t.time)]
)

export const liturgyActs = pgTable('liturgy_acts', {
  id: id(),
  liturgy_id: integer('liturgy_id')
    .notNull()
    .references(() => liturgies.id),
  position: integer('position').notNull(),
  name: text('name').notNull(),
  ...timestamps(),
})

export const liturgyMoments = pgTable(
  'liturgy_moments',
  {
    id: id(),
    act_id: integer('act_id')
      .notNull()
      .references(() => liturgyActs.id),
    position: integer('position').notNull(),
    type: momentType('type').notNull(),
    song_id: integer('song_id').references(() => songs.id),
    scripture_passages: jsonb('scripture_passages').$type<ScripturePassage[]>(),
    description: text('description'),
    sermon_speaker: text('sermon_speaker'),
    sacrament_type: sacramentType('sacrament_type'),
    ...timestamps(),
  },
  (t) => [check('sacrament_type_required', sql`${t.type} <> 'sacrament' OR ${t.sacrament_type} IS NOT NULL`)]
)
