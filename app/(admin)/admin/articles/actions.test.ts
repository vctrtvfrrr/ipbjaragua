import { eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { articles } from '@/db/schema'
import type { CurrentUser } from '@/lib/auth/current-user'
import { createTestDb, type TestDb } from '@/tests/db'
import { seedArticles } from '@/tests/seed'
import { createArticleAction, deleteArticleAction, updateArticleAction } from './actions'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

function formData(entries: [string, string][]) {
  const data = new FormData()
  for (const [name, value] of entries) data.append(name, value)
  return data
}

function articleForm(overrides: Partial<Record<string, string>> = {}) {
  return formData(
    Object.entries({
      title: 'Graça Soberana',
      slug: 'graca-soberana',
      author: '',
      date: '2026-01-02',
      excerpt: '',
      content: 'Conteúdo',
      ...overrides,
    })
  )
}

function userWithPermission(canReturn: boolean): CurrentUser {
  return {
    id: 1,
    email: 'ana@example.com',
    name: 'Ana',
    can: vi.fn(() => canReturn),
  }
}

describe('createArticleAction.execute', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
    vi.mocked(revalidatePath).mockClear()
  })

  it('denies users without article create permission without writing', async () => {
    const user = userWithPermission(false)

    const state = await createArticleAction.execute({ user, db }, articleForm())

    expect(state).toEqual({
      status: 'error',
      formError: 'Você não tem permissão para executar esta ação.',
    })
    expect(user.can).toHaveBeenCalledWith('articles', 'create')
    expect(await db.select().from(articles).where(isNull(articles.deleted_at))).toEqual([])
  })

  it('returns title field errors without writing', async () => {
    const state = await createArticleAction.execute({ user: userWithPermission(true), db }, articleForm({ title: '' }))

    expect(state).toEqual({
      status: 'error',
      fieldErrors: { title: ['Título é obrigatório'] },
    })
    expect(await db.select().from(articles).where(isNull(articles.deleted_at))).toEqual([])
  })

  it('returns slug field errors when slugify produces an empty slug without writing', async () => {
    const state = await createArticleAction.execute(
      { user: userWithPermission(true), db },
      articleForm({ slug: '---' })
    )

    expect(state).toEqual({
      status: 'error',
      fieldErrors: { slug: ['Slug é obrigatório'] },
    })
    expect(await db.select().from(articles).where(isNull(articles.deleted_at))).toEqual([])
  })

  it('inserts an article for users with article create permission', async () => {
    const state = await createArticleAction.execute({ user: userWithPermission(true), db }, articleForm())

    expect(state).toEqual({ status: 'success' })
    const rows = await db.select().from(articles).where(eq(articles.slug, 'graca-soberana'))
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      title: 'Graça Soberana',
      author: null,
      excerpt: null,
      content: 'Conteúdo',
    })
    expect(revalidatePath).toHaveBeenCalledWith('/')
    expect(revalidatePath).toHaveBeenCalledWith('/articles')
    expect(revalidatePath).toHaveBeenCalledWith('/articles/graca-soberana')
  })
})

describe('updateArticleAction.execute', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
    vi.mocked(revalidatePath).mockClear()
  })

  it('denies users without article update permission without writing', async () => {
    const [id] = await seedArticles(db, [{ slug: 'original', title: 'Original', date: '2026-01-01' }])
    const user = userWithPermission(false)

    const state = await updateArticleAction.execute(
      { user, db },
      articleForm({ id: String(id), oldSlug: 'original', title: 'Atualizado' })
    )

    expect(state).toEqual({
      status: 'error',
      formError: 'Você não tem permissão para executar esta ação.',
    })
    expect(user.can).toHaveBeenCalledWith('articles', 'update')
    const rows = await db.select().from(articles).where(eq(articles.id, id))
    expect(rows[0]?.title).toBe('Original')
  })

  it('returns title field errors without writing', async () => {
    const [id] = await seedArticles(db, [{ slug: 'original', title: 'Original', date: '2026-01-01' }])

    const state = await updateArticleAction.execute(
      { user: userWithPermission(true), db },
      articleForm({ id: String(id), oldSlug: 'original', title: '' })
    )

    expect(state).toEqual({
      status: 'error',
      fieldErrors: { title: ['Título é obrigatório'] },
    })
    const rows = await db.select().from(articles).where(eq(articles.id, id))
    expect(rows[0]?.title).toBe('Original')
  })

  it('updates an article and revalidates the old and new slugs', async () => {
    const [id] = await seedArticles(db, [{ slug: 'original', title: 'Original', date: '2026-01-01' }])

    const state = await updateArticleAction.execute(
      { user: userWithPermission(true), db },
      articleForm({ id: String(id), oldSlug: 'original', title: 'Atualizado', slug: 'novo-slug' })
    )

    expect(state).toEqual({ status: 'success' })
    const rows = await db.select().from(articles).where(eq(articles.id, id))
    expect(rows[0]).toMatchObject({ title: 'Atualizado', slug: 'novo-slug' })
    expect(revalidatePath).toHaveBeenCalledWith('/')
    expect(revalidatePath).toHaveBeenCalledWith('/articles')
    expect(revalidatePath).toHaveBeenCalledWith('/articles/original')
    expect(revalidatePath).toHaveBeenCalledWith('/articles/novo-slug')
    expect(revalidatePath).toHaveBeenCalledWith('/admin/articles')
  })
})

describe('deleteArticleAction.execute', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
    vi.mocked(revalidatePath).mockClear()
  })

  it('denies users without article delete permission without writing', async () => {
    const [id] = await seedArticles(db, [{ slug: 'ativo', title: 'Ativo', date: '2026-01-01' }])
    const user = userWithPermission(false)

    const state = await deleteArticleAction.execute({ user, db }, formData([['id', String(id)]]))

    expect(state).toEqual({
      status: 'error',
      formError: 'Você não tem permissão para executar esta ação.',
    })
    expect(user.can).toHaveBeenCalledWith('articles', 'delete')
    const rows = await db.select().from(articles).where(eq(articles.id, id))
    expect(rows[0]?.deleted_at).toBeNull()
  })

  it.each(['', 'abc'])('returns id field errors for %s without writing', async (invalidId) => {
    const [id] = await seedArticles(db, [{ slug: `ativo-${idLabel(invalidId)}`, title: 'Ativo', date: '2026-01-01' }])

    const state = await deleteArticleAction.execute(
      { user: userWithPermission(true), db },
      formData([['id', invalidId]])
    )

    expect(state.status).toBe('error')
    if (state.status === 'error') expect(state.fieldErrors?.id).toBeDefined()
    const rows = await db.select().from(articles).where(eq(articles.id, id))
    expect(rows[0]?.deleted_at).toBeNull()
  })

  it('soft-deletes an article and revalidates affected paths', async () => {
    const [id] = await seedArticles(db, [{ slug: 'ativo', title: 'Ativo', date: '2026-01-01' }])

    const state = await deleteArticleAction.execute(
      { user: userWithPermission(true), db },
      formData([['id', String(id)]])
    )

    expect(state).toEqual({ status: 'success' })
    const rows = await db.select().from(articles).where(eq(articles.id, id))
    expect(rows[0]?.deleted_at).not.toBeNull()
    expect(revalidatePath).toHaveBeenCalledWith('/')
    expect(revalidatePath).toHaveBeenCalledWith('/articles')
    expect(revalidatePath).toHaveBeenCalledWith('/articles/ativo')
    expect(revalidatePath).toHaveBeenCalledWith('/admin/articles')
  })
})

function idLabel(value: string): string {
  return value || 'vazio'
}
