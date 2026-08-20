import { and, asc, eq, max, sql } from 'drizzle-orm'
import { db as defaultDb, type Database } from '@/db'
import { meetingMinuteTopics, meetingMinutes, type MeetingMinuteStatus } from '@/db/schema'
import { churchYear, churchYearRange } from '@/lib/date'
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
  pdf_path: string | null
  topics: { title: string }[]
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

export class MeetingMinuteNotApprovedError extends Error {
  constructor(id: number) {
    super(`Meeting minute ${id} is not approved and keeps no stored PDF`)
    this.name = 'MeetingMinuteNotApprovedError'
  }
}

// Approving is a one-way door, so the transition rides a single conditional UPDATE: a second
// request finds no Pending row to move and leaves the consolidated Ata exactly as it was.
export async function approveMeetingMinute(id: number, db: Database = defaultDb): Promise<MeetingMinute> {
  const [approved] = await db
    .update(meetingMinutes)
    .set({ status: 'approved' })
    .where(and(eq(meetingMinutes.id, id), eq(meetingMinutes.status, 'pending')))
    .returning()

  if (approved) return approved

  const [existing] = await db.select().from(meetingMinutes).where(eq(meetingMinutes.id, id))
  if (!existing) throw new MeetingMinuteNotFoundError(id)

  return existing
}

// The name of the cache is decided in the database before any byte is written, so two
// generations racing on a cache-less Ata converge on one file instead of orphaning one.
export async function claimMeetingMinutePdfPath(
  id: number,
  candidate: string,
  db: Database = defaultDb
): Promise<string> {
  const [row] = await db
    .update(meetingMinutes)
    .set({ pdf_path: sql`coalesce(${meetingMinutes.pdf_path}, ${candidate})` })
    .where(and(eq(meetingMinutes.id, id), eq(meetingMinutes.status, 'approved')))
    .returning({ pdf_path: meetingMinutes.pdf_path })

  if (row?.pdf_path) return row.pdf_path

  const [existing] = await db.select({ id: meetingMinutes.id }).from(meetingMinutes).where(eq(meetingMinutes.id, id))
  throw existing ? new MeetingMinuteNotApprovedError(id) : new MeetingMinuteNotFoundError(id)
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

  return db.query.meetingMinutes.findMany({
    columns: { id: true, number: true, title: true, started_at: true, status: true, pdf_path: true },
    with: { topics: { columns: { title: true }, orderBy: { position: 'asc' } } },
    where: { started_at: { gte: from, lt: to } },
    orderBy: { number: 'asc' },
  })
}

export async function earliestMeetingMinuteYear(db: Database = defaultDb): Promise<number | null> {
  const [row] = await db
    .select({ started_at: meetingMinutes.started_at })
    .from(meetingMinutes)
    .orderBy(asc(meetingMinutes.started_at))
    .limit(1)

  return row ? churchYear(row.started_at) : null
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
