import { sql } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { createTestDb, type TestDb } from '@/test/db'
import { seedArticles, seedBulletins } from '@/test/seed'
import {
  countBulletins,
  getBulletinByDate,
  getLatestDominicalBulletin,
  listBulletins,
  listRecentBulletins,
} from './bulletins'

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

    const result = await listBulletins({ page: 1, pageSize: 10, today: '2026-12-31' }, db)

    expect(result.map((b) => b.date)).toEqual(['2026-03-01', '2026-02-01', '2026-01-01'])
  })

  it('excludes soft-deleted bulletins', async () => {
    seedBulletins(db, [
      { date: '2026-01-01', edition: 1 },
      { date: '2026-02-01', edition: 2 },
    ])
    db.run(sql`UPDATE bulletins SET deleted_at = CURRENT_TIMESTAMP WHERE date = '2026-02-01'`)

    const result = await listBulletins({ page: 1, pageSize: 10, today: '2026-12-31' }, db)

    expect(result.map((b) => b.date)).toEqual(['2026-01-01'])
  })

  it('excludes future-dated bulletins', async () => {
    seedBulletins(db, [
      { date: '2026-01-01', edition: 1 },
      { date: '2026-06-15', edition: 2 },
    ])

    const result = await listBulletins({ page: 1, pageSize: 10, today: '2026-06-12' }, db)

    expect(result.map((b) => b.date)).toEqual(['2026-01-01'])
  })

  it('includes a bulletin dated exactly today', async () => {
    seedBulletins(db, [{ date: '2026-06-12', edition: 1 }])

    const result = await listBulletins({ page: 1, pageSize: 10, today: '2026-06-12' }, db)

    expect(result.map((b) => b.date)).toEqual(['2026-06-12'])
  })

  it('returns only the requested page', async () => {
    seedBulletins(
      db,
      Array.from({ length: 5 }, (_, i) => ({
        date: `2026-01-0${i + 1}`,
        edition: i + 1,
      }))
    )

    const page2 = await listBulletins({ page: 2, pageSize: 2, today: '2026-12-31' }, db)

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

    expect(await countBulletins({ today: '2026-12-31' }, db)).toBe(2)
  })

  it('excludes future-dated bulletins', async () => {
    seedBulletins(db, [
      { date: '2026-01-01', edition: 1 },
      { date: '2026-06-15', edition: 2 },
    ])

    expect(await countBulletins({ today: '2026-06-12' }, db)).toBe(1)
  })
})

describe('getLatestDominicalBulletin', () => {
  let db: TestDb

  beforeEach(() => {
    db = createTestDb()
  })

  it('returns the most recent Sunday bulletin', async () => {
    // 2026-06-07 is a Sunday, 2026-06-12 is a Friday
    seedBulletins(db, [
      { date: '2026-06-07', edition: 70 },
      { date: '2026-06-12', edition: 71 },
    ])

    const result = await getLatestDominicalBulletin('2026-06-12', db)

    expect(result?.date).toBe('2026-06-07')
  })

  it('ignores exceptional bulletins (weekday != Sunday)', async () => {
    seedBulletins(db, [
      { date: '2026-06-12', edition: 71 }, // Friday
      { date: '2026-06-05', edition: 70 }, // Friday
    ])

    const result = await getLatestDominicalBulletin('2026-06-12', db)

    expect(result).toBeUndefined()
  })

  it('ignores future Sunday bulletins', async () => {
    seedBulletins(db, [
      { date: '2026-06-14', edition: 71 }, // Sunday but future
      { date: '2026-06-07', edition: 70 }, // Sunday, published
    ])

    const result = await getLatestDominicalBulletin('2026-06-12', db)

    expect(result?.date).toBe('2026-06-07')
  })

  it('returns undefined when no Sunday bulletin is published', async () => {
    const result = await getLatestDominicalBulletin('2026-06-12', db)

    expect(result).toBeUndefined()
  })

  it('returns a Sunday bulletin dated exactly today', async () => {
    // 2026-06-14 is a Sunday
    seedBulletins(db, [{ date: '2026-06-14', edition: 71 }])

    const result = await getLatestDominicalBulletin('2026-06-14', db)

    expect(result?.date).toBe('2026-06-14')
  })
})

describe('listRecentBulletins', () => {
  let db: TestDb

  beforeEach(() => {
    db = createTestDb()
  })

  it('returns up to limit bulletins ordered newest first', async () => {
    seedBulletins(
      db,
      Array.from({ length: 7 }, (_, i) => ({ date: `2026-01-0${i + 1}`, edition: i + 1 }))
    )

    const result = await listRecentBulletins({ today: '2026-12-31', limit: 5 }, db)

    expect(result).toHaveLength(5)
    expect(result[0].date).toBe('2026-01-07')
    expect(result[4].date).toBe('2026-01-03')
  })

  it('excludes future-dated bulletins', async () => {
    seedBulletins(db, [
      { date: '2026-01-01', edition: 1 },
      { date: '2026-06-15', edition: 2 },
    ])

    const result = await listRecentBulletins({ today: '2026-06-12', limit: 5 }, db)

    expect(result.map((b) => b.date)).toEqual(['2026-01-01'])
  })

  it('excludes soft-deleted bulletins', async () => {
    seedBulletins(db, [
      { date: '2026-01-01', edition: 1 },
      { date: '2026-02-01', edition: 2 },
    ])
    db.run(sql`UPDATE bulletins SET deleted_at = CURRENT_TIMESTAMP WHERE date = '2026-02-01'`)

    const result = await listRecentBulletins({ today: '2026-12-31', limit: 5 }, db)

    expect(result.map((b) => b.date)).toEqual(['2026-01-01'])
  })

  it('returns empty array when no bulletins are published', async () => {
    const result = await listRecentBulletins({ today: '2026-06-12', limit: 5 }, db)

    expect(result).toEqual([])
  })
})

describe('getBulletinByDate', () => {
  let db: TestDb

  beforeEach(() => {
    db = createTestDb()
  })

  it('returns bulletin matching the date', async () => {
    seedBulletins(db, [{ date: '2026-06-07', edition: 70 }])

    const result = await getBulletinByDate('2026-06-07', '2026-12-31', db)

    expect(result?.bulletin.date).toBe('2026-06-07')
    expect(result?.bulletin.edition).toBe(70)
  })

  it('returns undefined for unknown date', async () => {
    const result = await getBulletinByDate('2026-01-01', '2026-12-31', db)

    expect(result).toBeUndefined()
  })

  it('returns undefined for a future date', async () => {
    seedBulletins(db, [{ date: '2026-06-15', edition: 71 }])

    const result = await getBulletinByDate('2026-06-15', '2026-06-12', db)

    expect(result).toBeUndefined()
  })

  it('returns bulletin dated exactly today', async () => {
    seedBulletins(db, [{ date: '2026-06-12', edition: 71 }])

    const result = await getBulletinByDate('2026-06-12', '2026-06-12', db)

    expect(result?.bulletin.date).toBe('2026-06-12')
  })

  it('returns undefined for soft-deleted bulletin', async () => {
    seedBulletins(db, [{ date: '2026-06-07', edition: 70 }])
    db.run(sql`UPDATE bulletins SET deleted_at = CURRENT_TIMESTAMP WHERE date = '2026-06-07'`)

    const result = await getBulletinByDate('2026-06-07', '2026-12-31', db)

    expect(result).toBeUndefined()
  })

  it('includes the associated article when present', async () => {
    const [articleId] = seedArticles(db, [{ slug: 'graca', title: 'Graça Soberana', date: '2026-06-07' }])
    seedBulletins(db, [{ date: '2026-06-07', edition: 70, article_id: articleId }])

    const result = await getBulletinByDate('2026-06-07', '2026-12-31', db)

    expect(result?.article?.slug).toBe('graca')
  })

  it('returns null article when bulletin has no article', async () => {
    seedBulletins(db, [{ date: '2026-06-07', edition: 70 }])

    const result = await getBulletinByDate('2026-06-07', '2026-12-31', db)

    expect(result?.article).toBeNull()
  })

})
