import { sql } from 'drizzle-orm'
import { check, index, integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { id, timestamps } from './common-fields'

export const meetingMinuteStatus = pgEnum('meeting_minute_status', ['pending', 'approved'])
export type MeetingMinuteStatus = (typeof meetingMinuteStatus.enumValues)[number]

export const meetingMinutes = pgTable(
  'meeting_minutes',
  {
    id: id(),
    number: integer('number').notNull().unique(),
    title: text('title').notNull(),
    started_at: timestamp('started_at', { withTimezone: true, mode: 'date' }).notNull(),
    ended_at: timestamp('ended_at', { withTimezone: true, mode: 'date' }).notNull(),
    location: text('location').notNull(),
    attendees: text('attendees').notNull(),
    opening: text('opening').notNull(),
    closing: text('closing').notNull(),
    status: meetingMinuteStatus('status').notNull().default('pending'),
    ...timestamps(),
  },
  (t) => [
    check('meeting_minutes_ended_after_started', sql`${t.ended_at} > ${t.started_at}`),
    index('meeting_minutes_started_at_index').on(t.started_at),
  ]
)

export const meetingMinuteTopics = pgTable(
  'meeting_minute_topics',
  {
    id: id(),
    meeting_minute_id: integer('meeting_minute_id')
      .notNull()
      .references(() => meetingMinutes.id),
    position: integer('position').notNull(),
    title: text('title').notNull(),
    discussion: text('discussion').notNull(),
    ...timestamps(),
  },
  // Every read of a Tópico is "the Tópicos of this Ata, in order": the listing joins them
  // per Ata, so without this the planner rescans the whole table once per row.
  (t) => [index('meeting_minute_topics_minute_position_index').on(t.meeting_minute_id, t.position)]
)
