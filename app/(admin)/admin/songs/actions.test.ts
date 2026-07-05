import { eq, isNull, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { songs } from '@/db/schema'
import type { CurrentUser } from '@/lib/auth/current-user'
import { createTestDb, type TestDb } from '@/tests/db'
import { seedSongs } from '@/tests/seed'
import { createSongAction, deleteSongAction, updateSongAction } from './actions'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

const lyrics = JSON.stringify([{ type: 'verse', number: 1, content: 'Linha 1\nLinha 2' }])

function formData(entries: [string, string][]) {
  const data = new FormData()
  for (const [name, value] of entries) data.append(name, value)
  return data
}

function songForm(overrides: Partial<Record<string, string>> = {}) {
  return formData(
    Object.entries({
      title: 'Sublime Graça',
      songwriter: '',
      performer: 'Congregação',
      album: 'Novo Cântico',
      track: '27',
      lyrics,
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

describe('createSongAction.execute', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
    vi.mocked(revalidatePath).mockClear()
  })

  it('denies users without song create permission without writing', async () => {
    const user = userWithPermission(false)

    const state = await createSongAction.execute({ user, db }, songForm())

    expect(state).toEqual({
      status: 'error',
      formError: 'Você não tem permissão para executar esta ação.',
    })
    expect(user.can).toHaveBeenCalledWith('songs', 'create')
    expect(await db.select().from(songs).where(isNull(songs.deleted_at))).toEqual([])
  })

  it('returns a lyrics form error without writing when lyrics are invalid', async () => {
    const state = await createSongAction.execute(
      { user: userWithPermission(true), db },
      songForm({ lyrics: JSON.stringify([{ type: 'verse', number: 2, content: '' }]) })
    )

    expect(state.status).toBe('error')
    if (state.status === 'error') {
      expect(state.formError).toBe('Revise os blocos de letra.')
      expect(state.fieldErrors?.lyrics).toBeDefined()
      expect(state.values?.title).toBe('Sublime Graça')
    }
    expect(await db.select().from(songs).where(isNull(songs.deleted_at))).toEqual([])
  })

  it('inserts a song with a server-generated slug and revalidates liturgies', async () => {
    const state = await createSongAction.execute({ user: userWithPermission(true), db }, songForm())

    expect(state).toEqual({ status: 'success' })
    const rows = await db.select().from(songs).where(eq(songs.slug, 'sublime-graca'))
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      title: 'Sublime Graça',
      songwriter: null,
      performer: 'Congregação',
      album: 'Novo Cântico',
      track: 27,
      lyrics: [{ type: 'verse', number: 1, content: 'Linha 1\nLinha 2' }],
    })
    expect(revalidatePath).toHaveBeenCalledWith('/liturgies/[slug]', 'page')
  })

  it('allocates slug collisions against soft-deleted songs', async () => {
    await seedSongs(db, [{ slug: 'sublime-graca', title: 'Sublime Graça' }])
    await db
      .update(songs)
      .set({ deleted_at: sql`CURRENT_TIMESTAMP` })
      .where(eq(songs.slug, 'sublime-graca'))

    await createSongAction.execute({ user: userWithPermission(true), db }, songForm())

    const rows = await db.select().from(songs).where(eq(songs.slug, 'sublime-graca-2'))
    expect(rows).toHaveLength(1)
  })
})

describe('updateSongAction.execute', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
    vi.mocked(revalidatePath).mockClear()
  })

  it('denies users without song update permission without writing', async () => {
    const [id] = await seedSongs(db, [{ slug: 'original', title: 'Original' }])
    const user = userWithPermission(false)

    const state = await updateSongAction.execute({ user, db }, songForm({ id: String(id), title: 'Atualizada' }))

    expect(state).toEqual({
      status: 'error',
      formError: 'Você não tem permissão para executar esta ação.',
    })
    expect(user.can).toHaveBeenCalledWith('songs', 'update')
    const rows = await db.select().from(songs).where(eq(songs.id, id))
    expect(rows[0]?.title).toBe('Original')
  })

  it('updates catalog fields and lyrics while keeping the original slug', async () => {
    const [id] = await seedSongs(db, [{ slug: 'original', title: 'Original' }])

    const state = await updateSongAction.execute({ user: userWithPermission(true), db }, songForm({ id: String(id) }))

    expect(state).toEqual({ status: 'success' })
    const rows = await db.select().from(songs).where(eq(songs.id, id))
    expect(rows[0]).toMatchObject({ slug: 'original', title: 'Sublime Graça', track: 27 })
    expect(revalidatePath).toHaveBeenCalledWith('/liturgies/[slug]', 'page')
  })
})

describe('deleteSongAction.execute', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
    vi.mocked(revalidatePath).mockClear()
  })

  it('denies users without song delete permission without writing', async () => {
    const [id] = await seedSongs(db, [{ slug: 'ativo', title: 'Ativo' }])
    const user = userWithPermission(false)

    const state = await deleteSongAction.execute({ user, db }, formData([['id', String(id)]]))

    expect(state).toEqual({
      status: 'error',
      formError: 'Você não tem permissão para executar esta ação.',
    })
    expect(user.can).toHaveBeenCalledWith('songs', 'delete')
    const rows = await db.select().from(songs).where(eq(songs.id, id))
    expect(rows[0]?.deleted_at).toBeNull()
  })

  it('soft-deletes a song and revalidates liturgies', async () => {
    const [id] = await seedSongs(db, [{ slug: 'ativo', title: 'Ativo' }])

    const state = await deleteSongAction.execute({ user: userWithPermission(true), db }, formData([['id', String(id)]]))

    expect(state).toEqual({ status: 'success' })
    const rows = await db.select().from(songs).where(eq(songs.id, id))
    expect(rows[0]?.deleted_at).not.toBeNull()
    expect(revalidatePath).toHaveBeenCalledWith('/liturgies/[slug]', 'page')
  })
})
