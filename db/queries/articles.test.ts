import { sql } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { createTestDb, type TestDb } from '@/tests/db'
import { seedArticles } from '@/tests/seed'
import { countArticles, getArticleBySlug, getLatestArticle, listArticles } from './articles'

describe('getArticleBySlug', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('returns the article matching the slug', async () => {
    await seedArticles(db, [{ slug: 'graca-soberana', title: 'Graça Soberana', date: '2026-01-01' }])

    const article = await getArticleBySlug('graca-soberana', db)

    expect(article?.title).toBe('Graça Soberana')
  })

  it('returns undefined when no article matches the slug', async () => {
    const article = await getArticleBySlug('inexistente', db)

    expect(article).toBeUndefined()
  })

  it('ignores soft-deleted articles', async () => {
    await seedArticles(db, [{ slug: 'removido', title: 'Removido', date: '2026-01-01' }])
    await db.execute(sql`UPDATE articles SET deleted_at = CURRENT_TIMESTAMP WHERE slug = 'removido'`)

    const article = await getArticleBySlug('removido', db)

    expect(article).toBeUndefined()
  })
})

describe('listArticles', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('returns articles most recent first', async () => {
    await seedArticles(db, [
      { slug: 'velho', title: 'Velho', date: '2026-01-01' },
      { slug: 'novo', title: 'Novo', date: '2026-03-01' },
      { slug: 'meio', title: 'Meio', date: '2026-02-01' },
    ])

    const result = await listArticles({ page: 1, pageSize: 10 }, db)

    expect(result.map((a) => a.slug)).toEqual(['novo', 'meio', 'velho'])
  })

  it('excludes soft-deleted articles', async () => {
    await seedArticles(db, [
      { slug: 'ativo', title: 'Ativo', date: '2026-01-01' },
      { slug: 'removido', title: 'Removido', date: '2026-02-01' },
    ])
    await db.execute(sql`UPDATE articles SET deleted_at = CURRENT_TIMESTAMP WHERE slug = 'removido'`)

    const result = await listArticles({ page: 1, pageSize: 10 }, db)

    expect(result.map((a) => a.slug)).toEqual(['ativo'])
  })

  it('returns only the requested page', async () => {
    await seedArticles(
      db,
      Array.from({ length: 5 }, (_, i) => ({
        slug: `a${i}`,
        title: `A${i}`,
        date: `2026-01-0${i + 1}`,
      }))
    )

    const page2 = await listArticles({ page: 2, pageSize: 2 }, db)

    expect(page2.map((a) => a.slug)).toEqual(['a2', 'a1'])
  })
})

describe('countArticles', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('counts only non-deleted articles', async () => {
    await seedArticles(db, [
      { slug: 'a', title: 'A', date: '2026-01-01' },
      { slug: 'b', title: 'B', date: '2026-01-02' },
      { slug: 'c', title: 'C', date: '2026-01-03' },
    ])
    await db.execute(sql`UPDATE articles SET deleted_at = CURRENT_TIMESTAMP WHERE slug = 'c'`)

    expect(await countArticles(db)).toBe(2)
  })
})

describe('getLatestArticle', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('returns the most recent article', async () => {
    await seedArticles(db, [
      { slug: 'velho', title: 'Velho', date: '2026-01-01' },
      { slug: 'recente', title: 'Recente', date: '2026-03-01' },
    ])

    const latest = await getLatestArticle(db)

    expect(latest?.slug).toBe('recente')
  })

  it('returns undefined when there are no articles', async () => {
    expect(await getLatestArticle(db)).toBeUndefined()
  })

  it('ignores soft-deleted articles', async () => {
    await seedArticles(db, [
      { slug: 'ativo', title: 'Ativo', date: '2026-01-01' },
      { slug: 'recente-removido', title: 'Recente Removido', date: '2026-03-01' },
    ])
    await db.execute(sql`UPDATE articles SET deleted_at = CURRENT_TIMESTAMP WHERE slug = 'recente-removido'`)

    const latest = await getLatestArticle(db)

    expect(latest?.slug).toBe('ativo')
  })
})
