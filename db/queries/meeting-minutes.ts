import { and, asc, eq, gte, lt, max } from 'drizzle-orm'
import { db as defaultDb, type Database } from '@/db'
import { meetingMinuteTopics, meetingMinutes, type MeetingMinuteStatus } from '@/db/schema'
import { churchYearRange } from '@/lib/date'
import type { CreateMeetingMinuteInput } from '@/lib/meeting-minute'

export type MeetingMinute = typeof meetingMinutes.$inferSelect

export type MeetingMinuteTopic = typeof meetingMinuteTopics.$inferSelect

export type MeetingMinuteWithTopics = MeetingMinute & { topics: MeetingMinuteTopic[] }

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

export async function getMeetingMinuteById(
  id: number,
  db: Database = defaultDb
): Promise<MeetingMinuteWithTopics | null> {
  const [minute] = await db.select().from(meetingMinutes).where(eq(meetingMinutes.id, id))
  if (!minute) return null

  const topics = await db
    .select()
    .from(meetingMinuteTopics)
    .where(eq(meetingMinuteTopics.meeting_minute_id, id))
    .orderBy(asc(meetingMinuteTopics.position))

  return { ...minute, topics }
}

export class MeetingMinuteNotFoundError extends Error {
  constructor(id: number) {
    super(`Meeting minute ${id} was not found`)
    this.name = 'MeetingMinuteNotFoundError'
  }
}

export class MeetingMinuteImmutableError extends Error {
  constructor(id: number) {
    super(`Meeting minute ${id} is approved and admits no change`)
    this.name = 'MeetingMinuteImmutableError'
  }
}

export async function updateMeetingMinute(
  id: number,
  input: CreateMeetingMinuteInput,
  db: Database = defaultDb
): Promise<MeetingMinute> {
  try {
    return await db.transaction(async (tx) => {
      // The status filter rides the UPDATE so a concurrent Aprovação cannot slip
      // between a read guard and the write: zero rows means missing or Aprovada.
      const [minute] = await tx
        .update(meetingMinutes)
        .set({
          number: input.number,
          title: input.title,
          started_at: input.started_at,
          ended_at: input.ended_at,
          location: input.location,
          attendees: input.attendees,
          opening: input.opening,
          closing: input.closing,
        })
        .where(and(eq(meetingMinutes.id, id), eq(meetingMinutes.status, 'pending')))
        .returning()

      if (!minute) {
        const [existing] = await tx
          .select({ id: meetingMinutes.id })
          .from(meetingMinutes)
          .where(eq(meetingMinutes.id, id))
        throw existing ? new MeetingMinuteImmutableError(id) : new MeetingMinuteNotFoundError(id)
      }

      await tx.delete(meetingMinuteTopics).where(eq(meetingMinuteTopics.meeting_minute_id, id))
      await tx.insert(meetingMinuteTopics).values(
        input.topics.map((topic, position) => ({
          meeting_minute_id: id,
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
