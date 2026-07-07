import { eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { announcements } from '@/db/schema'
import type { CurrentUser } from '@/lib/auth/current-user'
import { createTestDb, type TestDb } from '@/tests/db'
import { seedAnnouncements } from '@/tests/seed'
import { createAnnouncementAction, deleteAnnouncementAction, updateAnnouncementAction } from './actions'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

function formData(entries: [string, string][]) {
  const data = new FormData()
  for (const [name, value] of entries) data.append(name, value)
  return data
}

function announcementForm(overrides: Partial<Record<string, string>> = {}) {
  return formData(
    Object.entries({
      title: 'Ensaio do coral',
      description: 'O ensaio será após o culto.',
      url: '',
      expires_at: '2026-07-12',
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

function expectAnnouncementRevalidation() {
  expect(revalidatePath).toHaveBeenCalledWith('/')
  expect(revalidatePath).toHaveBeenCalledWith('/bulletins/[date]', 'page')
  expect(revalidatePath).toHaveBeenCalledWith('/admin/announcements', 'page')
  expect(revalidatePath).toHaveBeenCalledWith('/admin/announcements/new')
  expect(revalidatePath).toHaveBeenCalledWith('/admin/announcements/[id]/edit', 'page')
}

describe('createAnnouncementAction.execute', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
    vi.mocked(revalidatePath).mockClear()
  })

  it('denies users without announcement create permission without writing', async () => {
    const user = userWithPermission(false)

    const state = await createAnnouncementAction.execute({ user, db }, announcementForm())

    expect(state).toEqual({
      status: 'error',
      formError: 'Você não tem permissão para executar esta ação.',
    })
    expect(user.can).toHaveBeenCalledWith('announcements', 'create')
    expect(await db.select().from(announcements).where(isNull(announcements.deleted_at))).toEqual([])
  })

  it('returns required field errors without writing', async () => {
    const state = await createAnnouncementAction.execute(
      { user: userWithPermission(true), db },
      announcementForm({ title: '', description: '', expires_at: '' })
    )

    expect(state.status).toBe('error')
    if (state.status === 'error') {
      expect(state.fieldErrors?.title).toEqual(['Título é obrigatório'])
      expect(state.fieldErrors?.description).toEqual(['Descrição é obrigatória'])
      expect(state.fieldErrors?.expires_at).toBeDefined()
      expect(state.values?.title).toBe('')
    }
    expect(await db.select().from(announcements).where(isNull(announcements.deleted_at))).toEqual([])
  })

  it.each(['javascript:alert(1)', '/avisos', 'mailto:secretaria@example.com'])(
    'rejects non-http absolute URLs: %s',
    async (url) => {
      const state = await createAnnouncementAction.execute(
        { user: userWithPermission(true), db },
        announcementForm({ url })
      )

      expect(state.status).toBe('error')
      if (state.status === 'error') {
        expect(state.fieldErrors?.url).toEqual(['URL deve ser absoluta e começar com http:// ou https://'])
      }
      expect(await db.select().from(announcements).where(isNull(announcements.deleted_at))).toEqual([])
    }
  )

  it('inserts an announcement with null empty URL and revalidates affected pages', async () => {
    const state = await createAnnouncementAction.execute({ user: userWithPermission(true), db }, announcementForm())

    expect(state).toEqual({ status: 'success' })
    const rows = await db.select().from(announcements).where(eq(announcements.title, 'Ensaio do coral'))
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      description: 'O ensaio será após o culto.',
      url: null,
    })
    expectAnnouncementRevalidation()
  })

  it('stores absolute http URLs', async () => {
    await createAnnouncementAction.execute(
      { user: userWithPermission(true), db },
      announcementForm({ url: 'https://example.com/inscricao' })
    )

    const rows = await db.select().from(announcements).where(eq(announcements.title, 'Ensaio do coral'))
    expect(rows[0]?.url).toBe('https://example.com/inscricao')
  })
})

describe('updateAnnouncementAction.execute', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
    vi.mocked(revalidatePath).mockClear()
  })

  it('denies users without announcement update permission without writing', async () => {
    await seedAnnouncements(db, [{ title: 'Original', expires_at: '2026-07-12' }])
    const [announcement] = await db.select().from(announcements).where(eq(announcements.title, 'Original'))
    const user = userWithPermission(false)

    const state = await updateAnnouncementAction.execute(
      { user, db },
      announcementForm({ id: String(announcement.id), title: 'Atualizado' })
    )

    expect(state).toEqual({
      status: 'error',
      formError: 'Você não tem permissão para executar esta ação.',
    })
    expect(user.can).toHaveBeenCalledWith('announcements', 'update')
    const rows = await db.select().from(announcements).where(eq(announcements.id, announcement.id))
    expect(rows[0]?.title).toBe('Original')
  })

  it('updates an announcement without blocking past expiration dates', async () => {
    await seedAnnouncements(db, [{ title: 'Original', expires_at: '2026-07-12' }])
    const [announcement] = await db.select().from(announcements).where(eq(announcements.title, 'Original'))

    const state = await updateAnnouncementAction.execute(
      { user: userWithPermission(true), db },
      announcementForm({ id: String(announcement.id), title: 'Atualizado', expires_at: '2020-01-02' })
    )

    expect(state).toEqual({ status: 'success' })
    const rows = await db.select().from(announcements).where(eq(announcements.id, announcement.id))
    expect(rows[0]).toMatchObject({ title: 'Atualizado', url: null })
    expect(rows[0]?.expires_at.toISOString().slice(0, 10)).toBe('2020-01-02')
    expectAnnouncementRevalidation()
  })
})

describe('deleteAnnouncementAction.execute', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
    vi.mocked(revalidatePath).mockClear()
  })

  it('denies users without announcement delete permission without writing', async () => {
    await seedAnnouncements(db, [{ title: 'Ativo', expires_at: '2026-07-12' }])
    const [announcement] = await db.select().from(announcements).where(eq(announcements.title, 'Ativo'))
    const user = userWithPermission(false)

    const state = await deleteAnnouncementAction.execute({ user, db }, formData([['id', String(announcement.id)]]))

    expect(state).toEqual({
      status: 'error',
      formError: 'Você não tem permissão para executar esta ação.',
    })
    expect(user.can).toHaveBeenCalledWith('announcements', 'delete')
    const rows = await db.select().from(announcements).where(eq(announcements.id, announcement.id))
    expect(rows[0]?.deleted_at).toBeNull()
  })

  it('soft-deletes an announcement and revalidates affected pages', async () => {
    await seedAnnouncements(db, [{ title: 'Ativo', expires_at: '2026-07-12' }])
    const [announcement] = await db.select().from(announcements).where(eq(announcements.title, 'Ativo'))

    const state = await deleteAnnouncementAction.execute(
      { user: userWithPermission(true), db },
      formData([['id', String(announcement.id)]])
    )

    expect(state).toEqual({ status: 'success' })
    const rows = await db.select().from(announcements).where(eq(announcements.id, announcement.id))
    expect(rows[0]?.deleted_at).not.toBeNull()
    expectAnnouncementRevalidation()
  })
})
