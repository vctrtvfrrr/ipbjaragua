import { sql } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { createTestDb, type TestDb } from '@/tests/db'
import { seedArticles, seedUsers } from '@/tests/seed'
import {
  ArticleAuthorNotEligibleError,
  ArticleNotFoundError,
  ArticleSlugCollisionError,
  countArticles,
  createArticle,
  getArticleById,
  getArticleBySlug,
  getLatestArticle,
  listArticles,
  softDeleteArticle,
  updateArticle,
} from './articles'

describe('createArticle', () => {
  let db: TestDb
  let authorId: number

  beforeEach(async () => {
    db = await createTestDb()
    ;[authorId] = await seedUsers(db, [{ email: 'joao@example.com', name: 'João', status: 'active' }])
  })

  it('inserts an article and returns the created row', async () => {
    const article = await createArticle(
      {
        title: 'Graça Soberana',
        slug: 'graca-soberana',
        author_id: authorId,
        date: new Date('2026-01-01T00:00:00.000Z'),
        excerpt: 'Resumo',
        content: 'Conteúdo',
      },
      db
    )

    expect(article).toMatchObject({
      id: 1,
      title: 'Graça Soberana',
      slug: 'graca-soberana',
      author_id: authorId,
      excerpt: 'Resumo',
      content: 'Conteúdo',
      deleted_at: null,
    })
  })

  it('rejects an author who is not an active user', async () => {
    const [disabledId] = await seedUsers(db, [{ email: 'off@example.com', name: 'Off', status: 'disabled' }])

    await expect(
      createArticle(
        {
          title: 'Graça Soberana',
          slug: 'graca-soberana',
          author_id: disabledId,
          date: new Date('2026-01-01T00:00:00.000Z'),
          excerpt: null,
          content: 'Conteúdo',
        },
        db
      )
    ).rejects.toBeInstanceOf(ArticleAuthorNotEligibleError)

    expect(await countArticles(db)).toBe(0)
  })

  it('resolves slug collision against an active article', async () => {
    await seedArticles(db, [{ slug: 'graca-soberana', title: 'Existente', date: '2026-01-01' }])

    const article = await createArticle(
      {
        title: 'Graça Soberana',
        slug: 'graca-soberana',
        author_id: authorId,
        date: new Date('2026-01-02T00:00:00.000Z'),
        excerpt: null,
        content: 'Conteúdo',
      },
      db
    )

    expect(article.slug).toBe('graca-soberana-2')
  })

  it('resolves slug collision against a soft-deleted article', async () => {
    await seedArticles(db, [{ slug: 'removido', title: 'Removido', date: '2026-01-01' }])
    await db.execute(sql`UPDATE articles SET deleted_at = CURRENT_TIMESTAMP WHERE slug = 'removido'`)

    const article = await createArticle(
      {
        title: 'Removido',
        slug: 'removido',
        author_id: authorId,
        date: new Date('2026-01-02T00:00:00.000Z'),
        excerpt: null,
        content: 'Conteúdo',
      },
      db
    )

    expect(article.slug).toBe('removido-2')
  })

  it('throws when all slug candidates are occupied', async () => {
    await seedArticles(
      db,
      Array.from({ length: 100 }, (_, i) => ({
        slug: i === 0 ? 'lotado' : `lotado-${i + 1}`,
        title: `Artigo ${i + 1}`,
        date: '2026-01-01',
      }))
    )

    await expect(
      createArticle(
        {
          title: 'Lotado',
          slug: 'lotado',
          author_id: authorId,
          date: new Date('2026-01-02T00:00:00.000Z'),
          excerpt: null,
          content: 'Conteúdo',
        },
        db
      )
    ).rejects.toBeInstanceOf(ArticleSlugCollisionError)
  })
})

describe('updateArticle', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('updates an active article by id and returns the updated row', async () => {
    const [maria] = await seedUsers(db, [{ email: 'maria@example.com', name: 'Maria', status: 'active' }])
    const [id] = await seedArticles(db, [{ slug: 'original', title: 'Original', date: '2026-01-01' }])

    const article = await updateArticle(
      id,
      {
        title: 'Atualizado',
        author_id: maria,
        date: new Date('2026-01-02T00:00:00.000Z'),
        excerpt: 'Novo resumo',
        content: 'Novo conteúdo',
      },
      db
    )

    expect(article).toMatchObject({
      id,
      slug: 'original',
      title: 'Atualizado',
      author_id: maria,
      excerpt: 'Novo resumo',
      content: 'Novo conteúdo',
    })
  })

  it('rejects reassigning to a non-active author', async () => {
    const [disabled] = await seedUsers(db, [{ email: 'off@example.com', name: 'Off', status: 'disabled' }])
    const [id] = await seedArticles(db, [{ slug: 'original', title: 'Original', date: '2026-01-01' }])

    await expect(updateArticle(id, { author_id: disabled }, db)).rejects.toBeInstanceOf(ArticleAuthorNotEligibleError)
  })

  it('keeps a now-disabled current author on an unrelated update', async () => {
    const [disabled] = await seedUsers(db, [{ email: 'off@example.com', name: 'Off', status: 'disabled' }])
    const [id] = await seedArticles(db, [
      { slug: 'original', title: 'Original', date: '2026-01-01', author_id: disabled },
    ])

    const article = await updateArticle(id, { title: 'Atualizado', author_id: disabled }, db)

    expect(article).toMatchObject({ id, title: 'Atualizado', author_id: disabled })
  })

  it('keeps the current slug when slug is undefined', async () => {
    const [id] = await seedArticles(db, [{ slug: 'slug-atual', title: 'Original', date: '2026-01-01' }])

    const article = await updateArticle(id, { title: 'Atualizado' }, db)

    expect(article.slug).toBe('slug-atual')
  })

  it('keeps the current slug when slug is equal to the current value', async () => {
    const [id] = await seedArticles(db, [{ slug: 'slug-atual', title: 'Original', date: '2026-01-01' }])

    const article = await updateArticle(id, { slug: 'slug-atual', title: 'Atualizado' }, db)

    expect(article.slug).toBe('slug-atual')
  })

  it('returns the current row when there is nothing to update', async () => {
    const [id] = await seedArticles(db, [{ slug: 'slug-atual', title: 'Original', date: '2026-01-01' }])

    const article = await updateArticle(id, {}, db)

    expect(article).toMatchObject({ id, slug: 'slug-atual', title: 'Original' })
  })

  it('resolves slug collision while excluding the current article', async () => {
    const [id] = await seedArticles(db, [
      { slug: 'original', title: 'Original', date: '2026-01-01' },
      { slug: 'destino', title: 'Destino', date: '2026-01-02' },
    ])

    const article = await updateArticle(id, { slug: 'destino' }, db)

    expect(article.slug).toBe('destino-2')
  })

  it('throws when the article does not exist', async () => {
    await expect(updateArticle(999, { title: 'Atualizado' }, db)).rejects.toBeInstanceOf(ArticleNotFoundError)
  })

  it('throws when the article is already soft-deleted', async () => {
    const [id] = await seedArticles(db, [{ slug: 'removido', title: 'Removido', date: '2026-01-01' }])
    await db.execute(sql`UPDATE articles SET deleted_at = CURRENT_TIMESTAMP WHERE id = ${id}`)

    await expect(updateArticle(id, { title: 'Atualizado' }, db)).rejects.toBeInstanceOf(ArticleNotFoundError)
  })
})

describe('softDeleteArticle', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('marks an active article as deleted and returns the deleted row', async () => {
    const [id] = await seedArticles(db, [{ slug: 'ativo', title: 'Ativo', date: '2026-01-01' }])

    const article = await softDeleteArticle(id, db)

    expect(article.id).toBe(id)
    expect(article.deleted_at).not.toBeNull()
  })

  it('hides the deleted article from public reads', async () => {
    const [id] = await seedArticles(db, [{ slug: 'ativo', title: 'Ativo', date: '2026-01-01' }])

    await softDeleteArticle(id, db)

    expect(await getArticleBySlug('ativo', db)).toBeUndefined()
    expect(await listArticles({ page: 1, pageSize: 10 }, db)).toEqual([])
  })

  it('throws when the article does not exist', async () => {
    await expect(softDeleteArticle(999, db)).rejects.toBeInstanceOf(ArticleNotFoundError)
  })

  it('throws when the article is already soft-deleted', async () => {
    const [id] = await seedArticles(db, [{ slug: 'removido', title: 'Removido', date: '2026-01-01' }])
    await db.execute(sql`UPDATE articles SET deleted_at = CURRENT_TIMESTAMP WHERE id = ${id}`)

    await expect(softDeleteArticle(id, db)).rejects.toBeInstanceOf(ArticleNotFoundError)
  })
})

describe('getArticleBySlug', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('returns the article matching the slug with the joined author name', async () => {
    const [authorId] = await seedUsers(db, [{ email: 'ana@example.com', name: 'Ana', status: 'active' }])
    await seedArticles(db, [
      { slug: 'graca-soberana', title: 'Graça Soberana', date: '2026-01-01', author_id: authorId },
    ])

    const article = await getArticleBySlug('graca-soberana', db)

    expect(article?.title).toBe('Graça Soberana')
    expect(article?.authorName).toBe('Ana')
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

describe('getArticleById', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('returns the article matching the id', async () => {
    const [id] = await seedArticles(db, [{ slug: 'graca-soberana', title: 'Graça Soberana', date: '2026-01-01' }])

    const article = await getArticleById(id, db)

    expect(article?.title).toBe('Graça Soberana')
  })

  it('returns undefined when no article matches the id', async () => {
    const article = await getArticleById(999, db)

    expect(article).toBeUndefined()
  })

  it('ignores soft-deleted articles', async () => {
    const [id] = await seedArticles(db, [{ slug: 'removido', title: 'Removido', date: '2026-01-01' }])
    await db.execute(sql`UPDATE articles SET deleted_at = CURRENT_TIMESTAMP WHERE id = ${id}`)

    const article = await getArticleById(id, db)

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
