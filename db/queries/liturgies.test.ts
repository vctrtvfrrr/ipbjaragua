import { sql } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { createTestDb, type TestDb } from '@/test/db'
import { seedLiturgies } from '@/test/seed'
import { countLiturgies, getLiturgyBySlug, listLiturgies, listLiturgiesByDate } from './liturgies'

describe('countLiturgies', () => {
  let db: TestDb

  beforeEach(() => {
    db = createTestDb()
  })

  it('excludes future-dated liturgies', async () => {
    seedLiturgies(db, [
      { date: '2026-01-01', theme: 'Culto Solene' },
      { date: '2026-06-15', theme: 'Culto da Família' },
    ])

    expect(await countLiturgies({ today: '2026-06-12' }, db)).toBe(1)
  })

  it('includes a liturgy dated exactly today', async () => {
    seedLiturgies(db, [{ date: '2026-06-12', theme: 'Culto Solene' }])

    expect(await countLiturgies({ today: '2026-06-12' }, db)).toBe(1)
  })

  it('excludes soft-deleted liturgies', async () => {
    seedLiturgies(db, [
      { date: '2026-01-01', theme: 'Culto Solene' },
      { date: '2026-02-01', theme: 'Culto da Família' },
    ])
    db.run(sql`UPDATE liturgies SET deleted_at = CURRENT_TIMESTAMP WHERE date = '2026-02-01'`)

    expect(await countLiturgies({ today: '2026-12-31' }, db)).toBe(1)
  })
})

describe('listLiturgies', () => {
  let db: TestDb

  beforeEach(() => {
    db = createTestDb()
  })

  it('returns liturgies most recent first', async () => {
    seedLiturgies(db, [
      { date: '2026-01-01', theme: 'Culto Solene' },
      { date: '2026-03-01', theme: 'Culto da Família' },
      { date: '2026-02-01', theme: 'Culto de Oração' },
    ])

    const result = await listLiturgies({ page: 1, pageSize: 10, today: '2026-12-31' }, db)

    expect(result.map((r) => r.date)).toEqual(['2026-03-01', '2026-02-01', '2026-01-01'])
  })

  it('excludes future-dated liturgies', async () => {
    seedLiturgies(db, [
      { date: '2026-01-01', theme: 'Culto Solene' },
      { date: '2026-06-15', theme: 'Culto da Família' },
    ])

    const result = await listLiturgies({ page: 1, pageSize: 10, today: '2026-06-12' }, db)

    expect(result.map((r) => r.date)).toEqual(['2026-01-01'])
  })

  it('excludes soft-deleted liturgies', async () => {
    seedLiturgies(db, [
      { date: '2026-01-01', theme: 'Culto Solene' },
      { date: '2026-02-01', theme: 'Culto da Família' },
    ])
    db.run(sql`UPDATE liturgies SET deleted_at = CURRENT_TIMESTAMP WHERE date = '2026-02-01'`)

    const result = await listLiturgies({ page: 1, pageSize: 10, today: '2026-12-31' }, db)

    expect(result.map((r) => r.date)).toEqual(['2026-01-01'])
  })

  it('returns only the requested page', async () => {
    seedLiturgies(
      db,
      Array.from({ length: 5 }, (_, i) => ({
        date: `2026-01-0${i + 1}`,
        theme: 'Culto Solene',
      }))
    )

    const page2 = await listLiturgies({ page: 2, pageSize: 2, today: '2026-12-31' }, db)

    expect(page2.map((r) => r.date)).toEqual(['2026-01-03', '2026-01-02'])
  })

  it('returns sermon description and speaker when present', async () => {
    const [id] = seedLiturgies(db, [{ date: '2026-06-07', theme: 'Culto Solene' }])
    db.run(sql`INSERT INTO liturgy_acts (liturgy_id, position, name) VALUES (${id}, 1, 'Mensagem')`)
    const act = db.get<{ id: number }>(sql`SELECT id FROM liturgy_acts WHERE liturgy_id = ${id}`)!
    db.run(
      sql`INSERT INTO liturgy_moments (act_id, position, type, description, sermon_speaker)
          VALUES (${act.id}, 1, 'sermon', 'A Graça Soberana', 'João Calvino')`
    )

    const result = await listLiturgies({ page: 1, pageSize: 10, today: '2026-12-31' }, db)

    expect(result[0].sermonDescription).toBe('A Graça Soberana')
    expect(result[0].sermonSpeaker).toBe('João Calvino')
  })

  it('returns null sermon fields when no sermon moment exists', async () => {
    seedLiturgies(db, [{ date: '2026-06-07', theme: 'Culto Solene' }])

    const result = await listLiturgies({ page: 1, pageSize: 10, today: '2026-12-31' }, db)

    expect(result[0].sermonDescription).toBeNull()
    expect(result[0].sermonSpeaker).toBeNull()
  })
})

describe('getLiturgyBySlug', () => {
  let db: TestDb

  beforeEach(() => {
    db = createTestDb()
  })

  it('returns liturgy matching the slug', async () => {
    seedLiturgies(db, [{ date: '2026-06-07', theme: 'Culto Solene' }])

    const result = await getLiturgyBySlug('2026-06-07-culto-solene', '2026-12-31', db)

    expect(result?.date).toBe('2026-06-07')
    expect(result?.theme).toBe('Culto Solene')
  })

  it('returns undefined for unknown slug', async () => {
    const result = await getLiturgyBySlug('2026-06-07-culto-solene', '2026-12-31', db)

    expect(result).toBeUndefined()
  })

  it('returns undefined for future-dated liturgy', async () => {
    seedLiturgies(db, [{ date: '2026-06-15', theme: 'Culto Solene' }])

    const result = await getLiturgyBySlug('2026-06-15-culto-solene', '2026-06-12', db)

    expect(result).toBeUndefined()
  })

  it('returns undefined for soft-deleted liturgy', async () => {
    seedLiturgies(db, [{ date: '2026-06-07', theme: 'Culto Solene' }])
    db.run(sql`UPDATE liturgies SET deleted_at = CURRENT_TIMESTAMP WHERE date = '2026-06-07'`)

    const result = await getLiturgyBySlug('2026-06-07-culto-solene', '2026-12-31', db)

    expect(result).toBeUndefined()
  })

  it('resolves the correct liturgy when two exist on the same date (time discriminator)', async () => {
    seedLiturgies(db, [
      { date: '2026-06-07', theme: 'Culto Solene', time: '09:00' },
      { date: '2026-06-07', theme: 'Culto Solene', time: '18:00' },
    ])

    const morning = await getLiturgyBySlug('2026-06-07-0900-culto-solene', '2026-12-31', db)
    const evening = await getLiturgyBySlug('2026-06-07-1800-culto-solene', '2026-12-31', db)

    expect(morning?.time).toBe('09:00')
    expect(evening?.time).toBe('18:00')
  })

  it('returns acts and moments ordered by position', async () => {
    const [id] = seedLiturgies(db, [{ date: '2026-06-07', theme: 'Culto Solene' }])
    db.run(sql`INSERT INTO liturgy_acts (liturgy_id, position, name) VALUES (${id}, 2, 'Adoração')`)
    db.run(sql`INSERT INTO liturgy_acts (liturgy_id, position, name) VALUES (${id}, 1, 'Introdução')`)
    const act = db.get<{ id: number }>(sql`SELECT id FROM liturgy_acts WHERE liturgy_id = ${id} AND position = 1`)!
    db.run(sql`INSERT INTO liturgy_moments (act_id, position, type) VALUES (${act.id}, 1, 'prayer')`)

    const result = await getLiturgyBySlug('2026-06-07-culto-solene', '2026-12-31', db)

    expect(result?.acts[0].name).toBe('Introdução')
    expect(result?.acts[1].name).toBe('Adoração')
    expect(result?.acts[0].moments).toHaveLength(1)
  })
})

describe('listLiturgiesByDate', () => {
  let db: TestDb

  beforeEach(() => {
    db = createTestDb()
  })

  it('returns empty array when no liturgies exist for the date', async () => {
    const result = await listLiturgiesByDate('2026-06-07', db)

    expect(result).toEqual([])
  })

  it('returns the liturgy for the exact date', async () => {
    seedLiturgies(db, [{ date: '2026-06-07', theme: 'Culto Solene' }])

    const result = await listLiturgiesByDate('2026-06-07', db)

    expect(result).toHaveLength(1)
    expect(result[0].theme).toBe('Culto Solene')
  })

  it('returns all liturgies when multiple exist on the same date', async () => {
    seedLiturgies(db, [
      { date: '2026-06-07', theme: 'Culto Solene', time: '09:00' },
      { date: '2026-06-07', theme: 'Culto Solene', time: '18:00' },
    ])

    const result = await listLiturgiesByDate('2026-06-07', db)

    expect(result).toHaveLength(2)
  })

  it('excludes liturgies from other dates', async () => {
    seedLiturgies(db, [
      { date: '2026-06-07', theme: 'Culto Solene' },
      { date: '2026-06-14', theme: 'Culto da Família' },
    ])

    const result = await listLiturgiesByDate('2026-06-07', db)

    expect(result.map((r) => r.theme)).toEqual(['Culto Solene'])
  })

  it('excludes soft-deleted liturgies', async () => {
    seedLiturgies(db, [{ date: '2026-06-07', theme: 'Culto Solene' }])
    db.run(sql`UPDATE liturgies SET deleted_at = CURRENT_TIMESTAMP WHERE date = '2026-06-07'`)

    const result = await listLiturgiesByDate('2026-06-07', db)

    expect(result).toEqual([])
  })
})
