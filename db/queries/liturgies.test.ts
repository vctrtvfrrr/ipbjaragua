import { sql } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { formatISODate, parseISODate } from '@/lib/date'
import { liturgyActs, liturgyMoments } from '@/db/schema'
import { createTestDb, type TestDb } from '@/tests/db'
import { seedLiturgies } from '@/tests/seed'
import {
  countFutureOrTodayLiturgies,
  countLiturgies,
  getLiturgyBySlug,
  getNextLiturgy,
  listLiturgies,
  listLiturgiesByDate,
} from './liturgies'

describe('countLiturgies', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('excludes draft liturgies for published-only visibility', async () => {
    await seedLiturgies(db, [
      { date: '2026-01-01', theme: 'Culto Solene' },
      { date: '2026-06-15', theme: 'Culto da Família', status: 'draft' },
    ])

    expect(await countLiturgies({ visibility: 'published-only' }, db)).toBe(1)
  })

  it('includes a future published liturgy', async () => {
    await seedLiturgies(db, [{ date: '2027-06-12', theme: 'Culto Solene' }])

    expect(await countLiturgies({ visibility: 'published-only' }, db)).toBe(1)
  })

  it('includes drafts when visibility allows them', async () => {
    await seedLiturgies(db, [{ date: '2026-06-12', theme: 'Culto Solene', status: 'draft' }])

    expect(await countLiturgies({ visibility: 'include-drafts' }, db)).toBe(1)
  })

  it('excludes soft-deleted liturgies', async () => {
    await seedLiturgies(db, [
      { date: '2026-01-01', theme: 'Culto Solene' },
      { date: '2026-02-01', theme: 'Culto da Família' },
    ])
    await db.execute(sql`UPDATE liturgies SET deleted_at = CURRENT_TIMESTAMP WHERE date = '2026-02-01'`)

    expect(await countLiturgies({ visibility: 'published-only' }, db)).toBe(1)
  })
})

describe('countFutureOrTodayLiturgies', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('counts liturgies dated today or later, excluding past ones', async () => {
    await seedLiturgies(db, [
      { date: '2026-06-01', theme: 'Culto Passado' },
      { date: '2026-06-14', theme: 'Culto de Hoje' },
      { date: '2026-06-21', theme: 'Culto Futuro' },
    ])

    const result = await countFutureOrTodayLiturgies(
      { visibility: 'published-only', fromDate: parseISODate('2026-06-14') },
      db
    )

    expect(result).toBe(2)
  })

  it('excludes drafts for published-only visibility', async () => {
    await seedLiturgies(db, [{ date: '2026-06-21', theme: 'Culto Futuro', status: 'draft' }])

    const result = await countFutureOrTodayLiturgies(
      { visibility: 'published-only', fromDate: parseISODate('2026-06-14') },
      db
    )

    expect(result).toBe(0)
  })

  it('locates the future/past boundary exactly at a pagination seam', async () => {
    const todayDate = '2026-06-14'
    const futureAndToday = Array.from({ length: 50 }, (_, i) => ({
      date: formatISODate(new Date(Date.parse(`${todayDate}T00:00:00Z`) + i * 86_400_000)),
      theme: `Culto Futuro ${i}`,
    }))
    const past = [
      { date: '2026-06-01', theme: 'Culto Passado 1' },
      { date: '2026-05-25', theme: 'Culto Passado 2' },
    ]
    await seedLiturgies(db, [...futureAndToday, ...past])

    const [futureCount, total, page1, page2] = await Promise.all([
      countFutureOrTodayLiturgies({ visibility: 'published-only', fromDate: parseISODate(todayDate) }, db),
      countLiturgies({ visibility: 'published-only' }, db),
      listLiturgies({ page: 1, pageSize: 50, visibility: 'published-only' }, db),
      listLiturgies({ page: 2, pageSize: 50, visibility: 'published-only' }, db),
    ])

    expect(futureCount).toBe(50)
    expect(total).toBe(52)
    // The boundary (index `futureCount - 1`) falls on the last item of page 1: the seam.
    expect(page1).toHaveLength(50)
    expect(formatISODate(page1[49].date) >= todayDate).toBe(true)
    expect(formatISODate(page2[0].date) < todayDate).toBe(true)
  })
})

describe('listLiturgies', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('returns liturgies most recent first', async () => {
    await seedLiturgies(db, [
      { date: '2026-01-01', theme: 'Culto Solene' },
      { date: '2026-03-01', theme: 'Culto da Família' },
      { date: '2026-02-01', theme: 'Culto de Oração' },
    ])

    const result = await listLiturgies({ page: 1, pageSize: 10, visibility: 'published-only' }, db)

    expect(result.map((r) => formatISODate(r.date))).toEqual(['2026-03-01', '2026-02-01', '2026-01-01'])
  })

  it('excludes drafts and includes future published liturgies', async () => {
    await seedLiturgies(db, [
      { date: '2026-01-01', theme: 'Culto Solene', status: 'draft' },
      { date: '2026-06-15', theme: 'Culto da Família' },
    ])

    const result = await listLiturgies({ page: 1, pageSize: 10, visibility: 'published-only' }, db)

    expect(result.map((r) => formatISODate(r.date))).toEqual(['2026-06-15'])
  })

  it('includes drafts when visibility allows them', async () => {
    await seedLiturgies(db, [{ date: '2026-01-01', theme: 'Culto Solene', status: 'draft' }])

    const result = await listLiturgies({ page: 1, pageSize: 10, visibility: 'include-drafts' }, db)

    expect(result.map((r) => r.theme)).toEqual(['Culto Solene'])
  })

  it.each([
    ['published-only', 2],
    ['include-drafts', 3],
  ] as const)('agrees with the count for %s visibility', async (visibility, expectedTotal) => {
    await seedLiturgies(db, [
      { date: '2026-01-01', theme: 'Culto Solene' },
      { date: '2026-02-01', theme: 'Culto da Família' },
      { date: '2026-03-01', theme: 'Culto de Oração', status: 'draft' },
    ])

    const [total, result] = await Promise.all([
      countLiturgies({ visibility }, db),
      listLiturgies({ page: 1, pageSize: 10, visibility }, db),
    ])

    expect(total).toBe(expectedTotal)
    expect(result).toHaveLength(expectedTotal)
  })

  it('excludes soft-deleted liturgies', async () => {
    await seedLiturgies(db, [
      { date: '2026-01-01', theme: 'Culto Solene' },
      { date: '2026-02-01', theme: 'Culto da Família' },
    ])
    await db.execute(sql`UPDATE liturgies SET deleted_at = CURRENT_TIMESTAMP WHERE date = '2026-02-01'`)

    const result = await listLiturgies({ page: 1, pageSize: 10, visibility: 'published-only' }, db)

    expect(result.map((r) => formatISODate(r.date))).toEqual(['2026-01-01'])
  })

  it('returns only the requested page', async () => {
    await seedLiturgies(
      db,
      Array.from({ length: 5 }, (_, i) => ({
        date: `2026-01-0${i + 1}`,
        theme: 'Culto Solene',
      }))
    )

    const page2 = await listLiturgies({ page: 2, pageSize: 2, visibility: 'published-only' }, db)

    expect(page2.map((r) => formatISODate(r.date))).toEqual(['2026-01-03', '2026-01-02'])
  })

  it('returns sermon description and speaker when present', async () => {
    const [id] = await seedLiturgies(db, [{ date: '2026-06-07', theme: 'Culto Solene' }])
    const [act] = await db
      .insert(liturgyActs)
      .values({ liturgy_id: id, position: 1, name: 'Mensagem' })
      .returning({ id: liturgyActs.id })
    await db.insert(liturgyMoments).values({
      act_id: act.id,
      position: 1,
      type: 'sermon',
      description: 'A Graça Soberana',
      sermon_speaker: 'João Calvino',
    })

    const result = await listLiturgies({ page: 1, pageSize: 10, visibility: 'published-only' }, db)

    expect(result[0].sermonDescription).toBe('A Graça Soberana')
    expect(result[0].sermonSpeaker).toBe('João Calvino')
  })

  it('returns null sermon fields when no sermon moment exists', async () => {
    await seedLiturgies(db, [{ date: '2026-06-07', theme: 'Culto Solene' }])

    const result = await listLiturgies({ page: 1, pageSize: 10, visibility: 'published-only' }, db)

    expect(result[0].sermonDescription).toBeNull()
    expect(result[0].sermonSpeaker).toBeNull()
  })
})

describe('getLiturgyBySlug', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('returns liturgy matching the slug', async () => {
    await seedLiturgies(db, [{ date: '2026-06-07', theme: 'Culto Solene' }])

    const result = await getLiturgyBySlug('2026-06-07-0900-culto-solene', 'published-only', db)

    expect(formatISODate(result!.date)).toBe('2026-06-07')
    expect(result?.theme).toBe('Culto Solene')
  })

  it('returns undefined for unknown slug', async () => {
    const result = await getLiturgyBySlug('2026-06-07-0900-culto-solene', 'published-only', db)

    expect(result).toBeUndefined()
  })

  it('returns a future published liturgy', async () => {
    await seedLiturgies(db, [{ date: '2026-06-15', theme: 'Culto Solene' }])

    const result = await getLiturgyBySlug('2026-06-15-0900-culto-solene', 'published-only', db)

    expect(result?.theme).toBe('Culto Solene')
  })

  it('hides a draft unless visibility allows drafts', async () => {
    await seedLiturgies(db, [{ date: '2026-06-15', theme: 'Culto Solene', status: 'draft' }])

    await expect(getLiturgyBySlug('2026-06-15-0900-culto-solene', 'published-only', db)).resolves.toBeUndefined()
    await expect(getLiturgyBySlug('2026-06-15-0900-culto-solene', 'include-drafts', db)).resolves.toMatchObject({
      theme: 'Culto Solene',
    })
  })

  it('returns undefined for soft-deleted liturgy', async () => {
    await seedLiturgies(db, [{ date: '2026-06-07', theme: 'Culto Solene' }])
    await db.execute(sql`UPDATE liturgies SET deleted_at = CURRENT_TIMESTAMP WHERE date = '2026-06-07'`)

    const result = await getLiturgyBySlug('2026-06-07-0900-culto-solene', 'published-only', db)

    expect(result).toBeUndefined()
  })

  it('resolves the correct liturgy when two exist on the same date (time discriminator)', async () => {
    await seedLiturgies(db, [
      { date: '2026-06-07', theme: 'Culto Solene', time: '09:00' },
      { date: '2026-06-07', theme: 'Culto Solene', time: '18:00' },
    ])

    const morning = await getLiturgyBySlug('2026-06-07-0900-culto-solene', 'published-only', db)
    const evening = await getLiturgyBySlug('2026-06-07-1800-culto-solene', 'published-only', db)

    expect(morning?.time).toBe('09:00')
    expect(evening?.time).toBe('18:00')
  })

  it('returns acts and moments ordered by position', async () => {
    const [id] = await seedLiturgies(db, [{ date: '2026-06-07', theme: 'Culto Solene' }])
    await db.insert(liturgyActs).values({ liturgy_id: id, position: 2, name: 'Adoração' })
    const [act] = await db
      .insert(liturgyActs)
      .values({ liturgy_id: id, position: 1, name: 'Introdução' })
      .returning({ id: liturgyActs.id })
    await db.insert(liturgyMoments).values({ act_id: act.id, position: 1, type: 'prayer' })

    const result = await getLiturgyBySlug('2026-06-07-0900-culto-solene', 'published-only', db)

    expect(result?.acts[0].name).toBe('Introdução')
    expect(result?.acts[1].name).toBe('Adoração')
    expect(result?.acts[0].moments).toHaveLength(1)
  })
})

describe('listLiturgiesByDate', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('returns empty array when no liturgies exist for the date', async () => {
    const result = await listLiturgiesByDate(parseISODate('2026-06-07'), 'published-only', db)

    expect(result).toEqual([])
  })

  it('filters drafts according to visibility', async () => {
    await seedLiturgies(db, [{ date: '2026-06-07', theme: 'Culto Solene', status: 'draft' }])

    await expect(listLiturgiesByDate(parseISODate('2026-06-07'), 'published-only', db)).resolves.toEqual([])
    await expect(listLiturgiesByDate(parseISODate('2026-06-07'), 'include-drafts', db)).resolves.toHaveLength(1)
  })

  it('returns the liturgy for the exact date', async () => {
    await seedLiturgies(db, [{ date: '2026-06-07', theme: 'Culto Solene' }])

    const result = await listLiturgiesByDate(parseISODate('2026-06-07'), 'published-only', db)

    expect(result).toHaveLength(1)
    expect(result[0].theme).toBe('Culto Solene')
  })

  it('returns all liturgies when multiple exist on the same date', async () => {
    await seedLiturgies(db, [
      { date: '2026-06-07', theme: 'Culto Solene', time: '09:00' },
      { date: '2026-06-07', theme: 'Culto Solene', time: '18:00' },
    ])

    const result = await listLiturgiesByDate(parseISODate('2026-06-07'), 'published-only', db)

    expect(result).toHaveLength(2)
  })

  it('excludes liturgies from other dates', async () => {
    await seedLiturgies(db, [
      { date: '2026-06-07', theme: 'Culto Solene' },
      { date: '2026-06-14', theme: 'Culto da Família' },
    ])

    const result = await listLiturgiesByDate(parseISODate('2026-06-07'), 'published-only', db)

    expect(result.map((r) => r.theme)).toEqual(['Culto Solene'])
  })

  it('excludes soft-deleted liturgies', async () => {
    await seedLiturgies(db, [{ date: '2026-06-07', theme: 'Culto Solene' }])
    await db.execute(sql`UPDATE liturgies SET deleted_at = CURRENT_TIMESTAMP WHERE date = '2026-06-07'`)

    const result = await listLiturgiesByDate(parseISODate('2026-06-07'), 'published-only', db)

    expect(result).toEqual([])
  })
})

describe('getNextLiturgy', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it("reports today's service that has not started as kind 'today'", async () => {
    await seedLiturgies(db, [{ date: '2026-06-14', theme: 'Culto Vespertino', time: '19:00' }])

    const result = await getNextLiturgy({ today: parseISODate('2026-06-14'), currentTime: '08:00' }, db)

    expect(result).toMatchObject({ kind: 'today', liturgy: { theme: 'Culto Vespertino', time: '19:00' } })
  })

  it('still reports it as today within an hour of the start', async () => {
    await seedLiturgies(db, [{ date: '2026-06-14', theme: 'Culto Vespertino', time: '19:00' }])

    const result = await getNextLiturgy({ today: parseISODate('2026-06-14'), currentTime: '19:45' }, db)

    expect(result?.kind).toBe('today')
  })

  it('falls back to the most recent past service, flagged as last-held, when nothing is ahead', async () => {
    await seedLiturgies(db, [
      { date: '2026-06-07', theme: 'Culto Solene', time: '18:00' },
      { date: '2026-05-31', theme: 'Culto de Oração', time: '19:30' },
    ])

    const result = await getNextLiturgy({ today: parseISODate('2026-06-10'), currentTime: '10:00' }, db)

    expect(result).toMatchObject({ kind: 'last-held', liturgy: { theme: 'Culto Solene' } })
  })

  it('highlights the earliest future service, not the most distant one', async () => {
    await seedLiturgies(db, [
      { date: '2026-06-07', theme: 'Culto Solene', time: '18:00' },
      { date: '2026-07-19', theme: 'Culto Distante', time: '18:00' },
      { date: '2026-06-21', theme: 'Culto da Familia', time: '18:00' },
    ])

    const result = await getNextLiturgy({ today: parseISODate('2026-06-10'), currentTime: '10:00' }, db)

    expect(result).toMatchObject({ kind: 'future', liturgy: { theme: 'Culto da Familia' } })
  })

  it('highlights a future service over a past one, with no lookahead cap', async () => {
    await seedLiturgies(db, [{ date: '2027-06-12', theme: 'Culto da Familia', time: '18:00' }])

    const result = await getNextLiturgy({ today: parseISODate('2026-06-10'), currentTime: '10:00' }, db)

    expect(result).toMatchObject({ kind: 'future', liturgy: { theme: 'Culto da Familia' } })
  })

  it('returns nothing when no service has been published at all', async () => {
    expect(await getNextLiturgy({ today: parseISODate('2026-06-10'), currentTime: '10:00' }, db)).toBeUndefined()
  })

  it('never selects a draft, since the highlight takes no visibility scope', async () => {
    await seedLiturgies(db, [{ date: '2026-06-14', theme: 'Culto Vespertino', status: 'draft' }])

    await expect(
      getNextLiturgy({ today: parseISODate('2026-06-14'), currentTime: '08:00' }, db)
    ).resolves.toBeUndefined()
  })

  it('never selects a future draft, falling back to the last held service instead', async () => {
    await seedLiturgies(db, [
      { date: '2026-06-07', theme: 'Culto Solene', time: '18:00' },
      { date: '2026-06-21', theme: 'Culto da Familia', time: '18:00', status: 'draft' },
    ])

    const result = await getNextLiturgy({ today: parseISODate('2026-06-10'), currentTime: '10:00' }, db)

    expect(result).toMatchObject({ kind: 'last-held', liturgy: { theme: 'Culto Solene' } })
  })
})
