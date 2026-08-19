import { defineRelations } from 'drizzle-orm'
import * as schema from './schema'

export const relations = defineRelations(schema, (r) => ({
  meetingMinutes: {
    topics: r.many.meetingMinuteTopics(),
  },
  meetingMinuteTopics: {
    minute: r.one.meetingMinutes({
      from: r.meetingMinuteTopics.meeting_minute_id,
      to: r.meetingMinutes.id,
    }),
  },
}))

export type Relations = typeof relations
