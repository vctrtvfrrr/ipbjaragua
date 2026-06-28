import { sql } from 'drizzle-orm'
import { check, integer, pgEnum, pgTable, text } from 'drizzle-orm/pg-core'
import { deletedAt, id, timestamps } from './common-fields'
import { songs } from './songs.schema'

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

export const liturgies = pgTable('liturgies', {
  id: id(),
  date: text('date').notNull(),
  theme: text('theme').notNull(),
  time: text('time'),
  ...timestamps(),
  ...deletedAt(),
})

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
    scripture_passages: text('scripture_passages'),
    description: text('description'),
    sermon_speaker: text('sermon_speaker'),
    sacrament_type: sacramentType('sacrament_type'),
    ...timestamps(),
  },
  (t) => [check('sacrament_type_required', sql`${t.type} <> 'sacrament' OR ${t.sacrament_type} IS NOT NULL`)]
)
