import { describe, expect, it } from 'vitest'
import { articles } from '@/db/schema'
import { createTestDb } from './db'
import { seedArticles } from './seed'

describe('createTestDb isolation', () => {
  it('resets data and restarts identity between calls', async () => {
    const db1 = await createTestDb()
    const [firstId] = await seedArticles(db1, [{ slug: 'a', title: 'A', date: '2026-01-01' }])
    expect(await db1.select().from(articles)).toHaveLength(1)

    const db2 = await createTestDb()
    expect(await db2.select().from(articles)).toHaveLength(0)

    const [secondId] = await seedArticles(db2, [{ slug: 'b', title: 'B', date: '2026-01-02' }])
    expect(secondId).toBe(firstId)
  })
})
