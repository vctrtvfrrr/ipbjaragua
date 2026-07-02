import { sql } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { formatISODate, parseISODate } from '@/lib/date'
import { liturgyActs, liturgyMoments } from '@/db/schema'
import { createTestDb, type TestDb } from '@/tests/db'
import { seedLiturgies } from '@/tests/seed'
import { countLiturgies, getLiturgyBySlug, listLiturgies, listLiturgiesByDate } from './liturgies'

describe('countLiturgies', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('excludes future-dated liturgies', async () => {
    await seedLiturgies(db, [
      { date: '2026-01-01', theme: 'Culto Solene' },
      { date: '2026-06-15', theme: 'Culto da Família' },
    ])

    expect(await countLiturgies({ today: parseISODate('2026-06-12') }, db)).toBe(1)
  })

  it('includes a liturgy dated exactly today', async () => {
    await seedLiturgies(db, [{ date: '2026-06-12', theme: 'Culto Solene' }])

    expect(await countLiturgies({ today: parseISODate('2026-06-12') }, db)).toBe(1)
  })

  it('excludes soft-deleted liturgies', async () => {
    await seedLiturgies(db, [
      { date: '2026-01-01', theme: 'Culto Solene' },
      { date: '2026-02-01', theme: 'Culto da Família' },
    ])
    await db.execute(sql`UPDATE liturgies SET deleted_at = CURRENT_TIMESTAMP WHERE date = '2026-02-01'`)

    expect(await countLiturgies({ today: parseISODate('2026-12-31') }, db)).toBe(1)
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

    const result = await listLiturgies({ page: 1, pageSize: 10, today: parseISODate('2026-12-31') }, db)

    expect(result.map((r) => formatISODate(r.date))).toEqual(['2026-03-01', '2026-02-01', '2026-01-01'])
  })

  it('excludes future-dated liturgies', async () => {
    await seedLiturgies(db, [
      { date: '2026-01-01', theme: 'Culto Solene' },
      { date: '2026-06-15', theme: 'Culto da Família' },
    ])

    const result = await listLiturgies({ page: 1, pageSize: 10, today: parseISODate('2026-06-12') }, db)

    expect(result.map((r) => formatISODate(r.date))).toEqual(['2026-01-01'])
  })

  it('excludes soft-deleted liturgies', async () => {
    await seedLiturgies(db, [
      { date: '2026-01-01', theme: 'Culto Solene' },
      { date: '2026-02-01', theme: 'Culto da Família' },
    ])
    await db.execute(sql`UPDATE liturgies SET deleted_at = CURRENT_TIMESTAMP WHERE date = '2026-02-01'`)

    const result = await listLiturgies({ page: 1, pageSize: 10, today: parseISODate('2026-12-31') }, db)

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

    const page2 = await listLiturgies({ page: 2, pageSize: 2, today: parseISODate('2026-12-31') }, db)

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

    const result = await listLiturgies({ page: 1, pageSize: 10, today: parseISODate('2026-12-31') }, db)

    expect(result[0].sermonDescription).toBe('A Graça Soberana')
    expect(result[0].sermonSpeaker).toBe('João Calvino')
  })

  it('returns null sermon fields when no sermon moment exists', async () => {
    await seedLiturgies(db, [{ date: '2026-06-07', theme: 'Culto Solene' }])

    const result = await listLiturgies({ page: 1, pageSize: 10, today: parseISODate('2026-12-31') }, db)

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

    const result = await getLiturgyBySlug('2026-06-07-culto-solene', parseISODate('2026-12-31'), db)

    expect(formatISODate(result!.date)).toBe('2026-06-07')
    expect(result?.theme).toBe('Culto Solene')
  })

  it('returns undefined for unknown slug', async () => {
    const result = await getLiturgyBySlug('2026-06-07-culto-solene', parseISODate('2026-12-31'), db)

    expect(result).toBeUndefined()
  })

  it('returns undefined for future-dated liturgy', async () => {
    await seedLiturgies(db, [{ date: '2026-06-15', theme: 'Culto Solene' }])

    const result = await getLiturgyBySlug('2026-06-15-culto-solene', parseISODate('2026-06-12'), db)

    expect(result).toBeUndefined()
  })

  it('returns undefined for soft-deleted liturgy', async () => {
    await seedLiturgies(db, [{ date: '2026-06-07', theme: 'Culto Solene' }])
    await db.execute(sql`UPDATE liturgies SET deleted_at = CURRENT_TIMESTAMP WHERE date = '2026-06-07'`)

    const result = await getLiturgyBySlug('2026-06-07-culto-solene', parseISODate('2026-12-31'), db)

    expect(result).toBeUndefined()
  })

  it('resolves the correct liturgy when two exist on the same date (time discriminator)', async () => {
    await seedLiturgies(db, [
      { date: '2026-06-07', theme: 'Culto Solene', time: '09:00' },
      { date: '2026-06-07', theme: 'Culto Solene', time: '18:00' },
    ])

    const morning = await getLiturgyBySlug('2026-06-07-0900-culto-solene', parseISODate('2026-12-31'), db)
    const evening = await getLiturgyBySlug('2026-06-07-1800-culto-solene', parseISODate('2026-12-31'), db)

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

    const result = await getLiturgyBySlug('2026-06-07-culto-solene', parseISODate('2026-12-31'), db)

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
    const result = await listLiturgiesByDate(parseISODate('2026-06-07'), db)

    expect(result).toEqual([])
  })

  it('returns the liturgy for the exact date', async () => {
    await seedLiturgies(db, [{ date: '2026-06-07', theme: 'Culto Solene' }])

    const result = await listLiturgiesByDate(parseISODate('2026-06-07'), db)

    expect(result).toHaveLength(1)
    expect(result[0].theme).toBe('Culto Solene')
  })

  it('returns all liturgies when multiple exist on the same date', async () => {
    await seedLiturgies(db, [
      { date: '2026-06-07', theme: 'Culto Solene', time: '09:00' },
      { date: '2026-06-07', theme: 'Culto Solene', time: '18:00' },
    ])

    const result = await listLiturgiesByDate(parseISODate('2026-06-07'), db)

    expect(result).toHaveLength(2)
  })

  it('excludes liturgies from other dates', async () => {
    await seedLiturgies(db, [
      { date: '2026-06-07', theme: 'Culto Solene' },
      { date: '2026-06-14', theme: 'Culto da Família' },
    ])

    const result = await listLiturgiesByDate(parseISODate('2026-06-07'), db)

    expect(result.map((r) => r.theme)).toEqual(['Culto Solene'])
  })

  it('excludes soft-deleted liturgies', async () => {
    await seedLiturgies(db, [{ date: '2026-06-07', theme: 'Culto Solene' }])
    await db.execute(sql`UPDATE liturgies SET deleted_at = CURRENT_TIMESTAMP WHERE date = '2026-06-07'`)

    const result = await listLiturgiesByDate(parseISODate('2026-06-07'), db)

    expect(result).toEqual([])
  })
})
