import { asc, eq, sql } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { meetingMinuteTopics, meetingMinutes } from '@/db/schema'
import { parseChurchDateTime } from '@/lib/date'
import type { CreateMeetingMinuteInput } from '@/lib/meeting-minute'
import { createTestDb, type TestDb } from '@/tests/db'
import {
  createMeetingMinute,
  earliestMeetingMinuteYear,
  getMeetingMinuteById,
  listMeetingMinutesByYear,
  MeetingMinuteImmutableError,
  MeetingMinuteNotFoundError,
  MeetingMinuteNumberTakenError,
  nextMeetingMinuteNumber,
  updateMeetingMinute,
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

  it('stores the Ata as Aprovação pendente with its Tópicos in order', async () => {
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

describe('getMeetingMinuteById', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('returns the Ata with its Tópicos in position order', async () => {
    const created = await createMeetingMinute(
      input({
        topics: [
          { title: 'Orçamento', discussion: 'Aprovado.' },
          { title: 'Reforma', discussion: 'Adiada.' },
        ],
      }),
      db
    )

    const minute = await getMeetingMinuteById(created.id, db)

    expect(minute).toMatchObject({
      id: created.id,
      number: 1,
      title: 'IPB de Jaraguá do Sul',
      status: 'pending',
    })
    expect(minute?.topics.map((topic) => topic.title)).toEqual(['Orçamento', 'Reforma'])
  })

  it('returns null when the Ata does not exist', async () => {
    expect(await getMeetingMinuteById(999, db)).toBeNull()
  })
})

describe('updateMeetingMinute', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('rewrites every field of the Ata, keeping its identity', async () => {
    const created = await createMeetingMinute(input(), db)

    const updated = await updateMeetingMinute(
      created.id,
      input({
        number: 9,
        title: 'Ata reformulada',
        started_at: parseChurchDateTime('2026-06-14T18:00'),
        ended_at: parseChurchDateTime('2026-06-14T19:30'),
        location: 'Sala de reuniões',
        attendees: '- Presbítero Pedro',
        opening: 'Aberta com leitura bíblica.',
        closing: 'Encerrada com oração.',
      }),
      db
    )

    expect(updated).toMatchObject({
      id: created.id,
      number: 9,
      title: 'Ata reformulada',
      location: 'Sala de reuniões',
      status: 'pending',
    })
    expect(updated?.started_at.toISOString()).toBe('2026-06-14T21:00:00.000Z')
    expect(await db.select().from(meetingMinutes)).toHaveLength(1)
  })

  it('replaces the Tópicos with the new set in the new order', async () => {
    const created = await createMeetingMinute(
      input({
        topics: [
          { title: 'Orçamento', discussion: 'Aprovado.' },
          { title: 'Reforma', discussion: 'Adiada.' },
        ],
      }),
      db
    )

    await updateMeetingMinute(
      created.id,
      input({
        topics: [
          { title: 'Reforma', discussion: 'Retomada.' },
          { title: 'Missões', discussion: 'Novo Tópico.' },
        ],
      }),
      db
    )

    const topics = await db
      .select({
        position: meetingMinuteTopics.position,
        title: meetingMinuteTopics.title,
        discussion: meetingMinuteTopics.discussion,
      })
      .from(meetingMinuteTopics)
      .where(eq(meetingMinuteTopics.meeting_minute_id, created.id))
      .orderBy(asc(meetingMinuteTopics.position))

    expect(topics).toEqual([
      { position: 0, title: 'Reforma', discussion: 'Retomada.' },
      { position: 1, title: 'Missões', discussion: 'Novo Tópico.' },
    ])
  })

  it('accepts keeping the same Número the Ata already has', async () => {
    const created = await createMeetingMinute(input({ number: 7 }), db)

    const updated = await updateMeetingMinute(created.id, input({ number: 7, title: 'Mesmo Número' }), db)

    expect(updated?.number).toBe(7)
  })

  it('rejects a Número taken by another Ata and leaves the Ata untouched', async () => {
    await createMeetingMinute(input({ number: 3 }), db)
    const created = await createMeetingMinute(
      input({
        number: 7,
        started_at: parseChurchDateTime('2026-06-14T19:30'),
        ended_at: parseChurchDateTime('2026-06-14T21:00'),
      }),
      db
    )

    await expect(updateMeetingMinute(created.id, input({ number: 3 }), db)).rejects.toThrow(
      MeetingMinuteNumberTakenError
    )

    const minute = await getMeetingMinuteById(created.id, db)
    expect(minute?.number).toBe(7)
    expect(minute?.title).toBe('IPB de Jaraguá do Sul')
    expect(minute?.topics.map((topic) => topic.title)).toEqual(['Orçamento'])
  })

  it('rejects an Ata Aprovada and leaves it untouched', async () => {
    const created = await createMeetingMinute(input(), db)
    await db.update(meetingMinutes).set({ status: 'approved' }).where(eq(meetingMinutes.id, created.id))

    await expect(updateMeetingMinute(created.id, input({ title: 'Tarde demais' }), db)).rejects.toThrow(
      MeetingMinuteImmutableError
    )

    const minute = await getMeetingMinuteById(created.id, db)
    expect(minute?.title).toBe('IPB de Jaraguá do Sul')
    expect(minute?.status).toBe('approved')
  })

  it('rejects an Ata that does not exist', async () => {
    await expect(updateMeetingMinute(999, input(), db)).rejects.toThrow(MeetingMinuteNotFoundError)
    expect(await db.select().from(meetingMinuteTopics)).toEqual([])
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

  it('brings the Tópico titles in deliberation order', async () => {
    const created = await createMeetingMinute(input(), db)
    await db.delete(meetingMinuteTopics)
    await db.insert(meetingMinuteTopics).values([
      { meeting_minute_id: created.id, position: 2, title: 'Missões', discussion: 'Em estudo.' },
      { meeting_minute_id: created.id, position: 0, title: 'Orçamento', discussion: 'Aprovado.' },
      { meeting_minute_id: created.id, position: 1, title: 'Reforma', discussion: 'Adiada.' },
    ])

    const [minute] = await listMeetingMinutesByYear(2026, db)

    expect(minute.topics).toEqual([{ title: 'Orçamento' }, { title: 'Reforma' }, { title: 'Missões' }])
  })

  it('brings an empty list for an Ata without Tópicos', async () => {
    await createMeetingMinute(input(), db)
    await db.delete(meetingMinuteTopics)

    const [minute] = await listMeetingMinutesByYear(2026, db)

    expect(minute.topics).toEqual([])
  })
})

describe('earliestMeetingMinuteYear', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('has no year to offer while no Ata exists', async () => {
    expect(await earliestMeetingMinuteYear(db)).toBeNull()
  })

  it('agrees with the yearly listing on an Início the zone barely reaches', async () => {
    await createMeetingMinute(
      input({
        started_at: parseChurchDateTime('1913-12-31T23:55'),
        ended_at: parseChurchDateTime('1914-01-01T01:00'),
      }),
      db
    )

    const year = await earliestMeetingMinuteYear(db)

    expect(year).toBe(1913)
    expect(await listMeetingMinutesByYear(year!, db)).toHaveLength(1)
  })

  it('reads the year of the oldest Início in America/Sao_Paulo', async () => {
    await createMeetingMinute(
      input({
        number: 2,
        started_at: parseChurchDateTime('2022-05-10T19:00'),
        ended_at: parseChurchDateTime('2022-05-10T20:00'),
      }),
      db
    )
    await createMeetingMinute(
      input({
        number: 1,
        started_at: parseChurchDateTime('2019-12-31T21:00'),
        ended_at: parseChurchDateTime('2020-01-01T00:30'),
      }),
      db
    )

    expect(await earliestMeetingMinuteYear(db)).toBe(2019)
  })
})
