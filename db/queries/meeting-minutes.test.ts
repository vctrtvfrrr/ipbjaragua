import { asc, eq, sql } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { meetingMinuteTopics, meetingMinutes } from '@/db/schema'
import { parseChurchDateTime } from '@/lib/date'
import type { CreateMeetingMinuteInput } from '@/lib/meeting-minute'
import { createTestDb, type TestDb } from '@/tests/db'
import {
  createMeetingMinute,
  listMeetingMinutesByYear,
  MeetingMinuteNumberTakenError,
  nextMeetingMinuteNumber,
} from './meeting-minutes'

function input(overrides: Partial<CreateMeetingMinuteInput> = {}): CreateMeetingMinuteInput {
  return {
    number: 1,
    title: 'IPB de Jaraguá do Sul',
    started_at: parseChurchDateTime('2026-06-07T19:30'),
    ended_at: parseChurchDateTime('2026-06-07T21:00'),
    location: 'Salão social',
    attendees: '- Pastor João',
    opening: 'A reunião foi aberta com oração.',
    closing: 'A reunião foi encerrada.',
    topics: [{ title: 'Orçamento', discussion: 'O orçamento anual foi aprovado.' }],
    ...overrides,
  }
}

describe('createMeetingMinute', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('stores the Ata as Pendente de aprovação with its Tópicos in order', async () => {
    const minute = await createMeetingMinute(
      input({
        topics: [
          { title: 'Orçamento', discussion: 'Aprovado.' },
          { title: 'Reforma', discussion: 'Adiada.' },
          { title: 'Missões', discussion: 'Em estudo.' },
        ],
      }),
      db
    )

    expect(minute.status).toBe('pending')

    const topics = await db
      .select({ position: meetingMinuteTopics.position, title: meetingMinuteTopics.title })
      .from(meetingMinuteTopics)
      .where(eq(meetingMinuteTopics.meeting_minute_id, minute.id))
      .orderBy(asc(meetingMinuteTopics.position))

    expect(topics).toEqual([
      { position: 0, title: 'Orçamento' },
      { position: 1, title: 'Reforma' },
      { position: 2, title: 'Missões' },
    ])
  })

  it('rejects a Número already taken and keeps a single Ata', async () => {
    await createMeetingMinute(input({ number: 7 }), db)

    await expect(createMeetingMinute(input({ number: 7 }), db)).rejects.toThrow(MeetingMinuteNumberTakenError)
    expect(await db.select().from(meetingMinutes)).toHaveLength(1)
  })

  it('accepts more than one Ata on the same Data', async () => {
    await createMeetingMinute(input({ number: 1 }), db)
    await createMeetingMinute(
      input({
        number: 2,
        started_at: parseChurchDateTime('2026-06-07T21:30'),
        ended_at: parseChurchDateTime('2026-06-07T22:30'),
      }),
      db
    )

    expect(await db.select().from(meetingMinutes)).toHaveLength(2)
  })

  it('leaves no Ata behind when the Tópicos fail to persist', async () => {
    await expect(
      createMeetingMinute(input({ topics: [{ title: 'Orçamento', discussion: null as never }] }), db)
    ).rejects.toThrow()

    expect(await db.select().from(meetingMinutes)).toEqual([])
  })
})

describe('meeting_minutes constraints', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('rejects a Término that is not later than the Início', async () => {
    await expect(
      createMeetingMinute(
        input({
          started_at: parseChurchDateTime('2026-06-07T21:00'),
          ended_at: parseChurchDateTime('2026-06-07T19:30'),
        }),
        db
      )
    ).rejects.toThrow()
  })

  it('keeps no soft-delete column on the Ata', async () => {
    const { rows } = await db.execute<{ column_name: string }>(
      sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'meeting_minutes'`
    )

    expect(rows.map((row) => row.column_name)).not.toContain('deleted_at')
  })
})

describe('nextMeetingMinuteNumber', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('starts at 1 and follows the highest Número, gaps included', async () => {
    expect(await nextMeetingMinuteNumber(db)).toBe(1)

    await createMeetingMinute(input({ number: 12 }), db)

    expect(await nextMeetingMinuteNumber(db)).toBe(13)
  })
})

describe('listMeetingMinutesByYear', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('lists the Atas of the civil year in ascending Número', async () => {
    await createMeetingMinute(
      input({
        number: 2,
        started_at: parseChurchDateTime('2026-03-10T19:00'),
        ended_at: parseChurchDateTime('2026-03-10T20:00'),
      }),
      db
    )
    await createMeetingMinute(
      input({
        number: 1,
        started_at: parseChurchDateTime('2026-08-18T19:00'),
        ended_at: parseChurchDateTime('2026-08-18T20:00'),
      }),
      db
    )

    const minutes = await listMeetingMinutesByYear(2026, db)

    expect(minutes.map((minute) => minute.number)).toEqual([1, 2])
    expect(minutes[0].status).toBe('pending')
  })

  it('places an Ata by its civil year, not by the UTC instant', async () => {
    await createMeetingMinute(
      input({
        started_at: parseChurchDateTime('2026-12-31T22:00'),
        ended_at: parseChurchDateTime('2027-01-01T00:30'),
      }),
      db
    )

    expect(await listMeetingMinutesByYear(2026, db)).toHaveLength(1)
    expect(await listMeetingMinutesByYear(2027, db)).toEqual([])
  })
})
