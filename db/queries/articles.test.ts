import { sql } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { createTestDb, type TestDb } from '@/test/db'
import { seedArticles } from '@/test/seed'
import { getArticleBySlug } from './articles'

describe('getArticleBySlug', () => {
  let db: TestDb

  beforeEach(() => {
    db = createTestDb()
  })

  it('returns the article matching the slug', async () => {
    seedArticles(db, [{ slug: 'graca-soberana', title: 'Graça Soberana', date: '2026-01-01' }])

    const article = await getArticleBySlug('graca-soberana', db)

    expect(article?.title).toBe('Graça Soberana')
  })

  it('returns undefined when no article matches the slug', async () => {
    const article = await getArticleBySlug('inexistente', db)

    expect(article).toBeUndefined()
  })

  it('ignores soft-deleted articles', async () => {
    seedArticles(db, [{ slug: 'removido', title: 'Removido', date: '2026-01-01' }])
    db.run(sql`UPDATE articles SET deleted_at = CURRENT_TIMESTAMP WHERE slug = 'removido'`)

    const article = await getArticleBySlug('removido', db)

    expect(article).toBeUndefined()
  })
})
