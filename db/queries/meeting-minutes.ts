import { and, asc, gte, lt, max } from 'drizzle-orm'
import { db as defaultDb, type Database } from '@/db'
import { meetingMinuteTopics, meetingMinutes, type MeetingMinuteStatus } from '@/db/schema'
import { churchYearRange } from '@/lib/date'
import type { CreateMeetingMinuteInput } from '@/lib/meeting-minute'

export type MeetingMinute = typeof meetingMinutes.$inferSelect

export type MeetingMinuteListItem = {
  id: number
  number: number
  title: string
  started_at: Date
  status: MeetingMinuteStatus
}

export class MeetingMinuteNumberTakenError extends Error {
  constructor(readonly number: number) {
    super(`Meeting minute number ${number} is already taken`)
    this.name = 'MeetingMinuteNumberTakenError'
  }
}

export async function createMeetingMinute(
  input: CreateMeetingMinuteInput,
  db: Database = defaultDb
): Promise<MeetingMinute> {
  try {
    return await db.transaction(async (tx) => {
      const [minute] = await tx
        .insert(meetingMinutes)
        .values({
          number: input.number,
          title: input.title,
          started_at: input.started_at,
          ended_at: input.ended_at,
          location: input.location,
          attendees: input.attendees,
          opening: input.opening,
          closing: input.closing,
          status: 'pending',
        })
        .returning()

      await tx.insert(meetingMinuteTopics).values(
        input.topics.map((topic, position) => ({
          meeting_minute_id: minute.id,
          position,
          title: topic.title,
          discussion: topic.discussion,
        }))
      )

      return minute
    })
  } catch (error) {
    throw translateMeetingMinuteWriteError(error, input.number)
  }
}

export async function nextMeetingMinuteNumber(db: Database = defaultDb): Promise<number> {
  const [row] = await db.select({ value: max(meetingMinutes.number) }).from(meetingMinutes)
  return (row?.value ?? 0) + 1
}

export async function listMeetingMinutesByYear(
  year: number,
  db: Database = defaultDb
): Promise<MeetingMinuteListItem[]> {
  const { from, to } = churchYearRange(year)

  return db
    .select({
      id: meetingMinutes.id,
      number: meetingMinutes.number,
      title: meetingMinutes.title,
      started_at: meetingMinutes.started_at,
      status: meetingMinutes.status,
    })
    .from(meetingMinutes)
    .where(and(gte(meetingMinutes.started_at, from), lt(meetingMinutes.started_at, to)))
    .orderBy(asc(meetingMinutes.number))
}

function translateMeetingMinuteWriteError(error: unknown, number: number): unknown {
  return violatesNumberUnique(error) ? new MeetingMinuteNumberTakenError(number) : error
}

function violatesNumberUnique(error: unknown, depth = 0): boolean {
  if (typeof error !== 'object' || error === null || depth > 4) return false
  if ('constraint' in error && error.constraint === 'meeting_minutes_number_unique') return true
  if (error instanceof Error && error.message.includes('meeting_minutes_number_unique')) return true

  return 'cause' in error ? violatesNumberUnique(error.cause, depth + 1) : false
}
