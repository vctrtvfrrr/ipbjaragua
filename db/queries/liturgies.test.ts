import { sql } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { createTestDb, type TestDb } from '@/test/db'
import { seedLiturgies } from '@/test/seed'
import { countLiturgies, listLiturgies } from './liturgies'

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

    // Newest first: 01-05, 01-04 | 01-03, 01-02 | 01-01 → page 2 is 01-03, 01-02
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
