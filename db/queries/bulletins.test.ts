import { sql } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { createTestDb, type TestDb } from '@/test/db'
import { seedBulletins } from '@/test/seed'
import { countBulletins, listBulletins } from './bulletins'

describe('listBulletins', () => {
  let db: TestDb

  beforeEach(() => {
    db = createTestDb()
  })

  it('returns bulletins most recent first', async () => {
    seedBulletins(db, [
      { date: '2026-01-01', edition: 1 },
      { date: '2026-03-01', edition: 3 },
      { date: '2026-02-01', edition: 2 },
    ])

    const result = await listBulletins({ page: 1, pageSize: 10 }, db)

    expect(result.map((b) => b.date)).toEqual(['2026-03-01', '2026-02-01', '2026-01-01'])
  })

  it('excludes soft-deleted bulletins', async () => {
    seedBulletins(db, [
      { date: '2026-01-01', edition: 1 },
      { date: '2026-02-01', edition: 2 },
    ])
    db.run(sql`UPDATE bulletins SET deleted_at = CURRENT_TIMESTAMP WHERE date = '2026-02-01'`)

    const result = await listBulletins({ page: 1, pageSize: 10 }, db)

    expect(result.map((b) => b.date)).toEqual(['2026-01-01'])
  })

  it('returns only the requested page', async () => {
    seedBulletins(
      db,
      Array.from({ length: 5 }, (_, i) => ({
        date: `2026-01-0${i + 1}`,
        edition: i + 1,
      })),
    )

    const page2 = await listBulletins({ page: 2, pageSize: 2 }, db)

    // Newest first: 01-05, 01-04 | 01-03, 01-02 | 01-01 -> page 2 is 01-03, 01-02
    expect(page2.map((b) => b.date)).toEqual(['2026-01-03', '2026-01-02'])
  })
})

describe('countBulletins', () => {
  let db: TestDb

  beforeEach(() => {
    db = createTestDb()
  })

  it('counts only non-deleted bulletins', async () => {
    seedBulletins(db, [
      { date: '2026-01-01', edition: 1 },
      { date: '2026-02-01', edition: 2 },
      { date: '2026-03-01', edition: 3 },
    ])
    db.run(sql`UPDATE bulletins SET deleted_at = CURRENT_TIMESTAMP WHERE date = '2026-03-01'`)

    expect(await countBulletins(db)).toBe(2)
  })
})
