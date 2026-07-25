import { eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { beforeEach, describe, expect, it } from 'vitest'
import { vi } from 'vitest'
import { agenda, announcements, featuredImages } from '@/db/schema'
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
      icon: 'Pin',
      featured_image_id: '',
      expires_at: '2026-07-12',
      ...overrides,
    })
  )
}

function userWithPermission(canReturn: boolean | ((entity: string, action: string) => boolean)): CurrentUser {
  return {
    id: 1,
    email: 'ana@example.com',
    name: 'Ana',
    can: vi.fn((entity, action) => (typeof canReturn === 'function' ? canReturn(entity, action) : canReturn)),
  }
}

async function seedFeaturedImage(db: TestDb, path = 'abc123.webp') {
  const [image] = await db.insert(featuredImages).values({ path }).returning()
  return image
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
    }
    expect(await db.select().from(announcements).where(isNull(announcements.deleted_at))).toEqual([])
  })

  it('echoes back submitted values so the form can restore them after a validation error', async () => {
    const state = await createAnnouncementAction.execute(
      { user: userWithPermission(true), db },
      announcementForm({ title: '' })
    )

    expect(state.status).toBe('error')
    if (state.status === 'error') {
      expect(state.values?.description).toBe('O ensaio será após o culto.')
      expect(state.values?.expires_at).toBe('2026-07-12')
    }
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
      icon: 'Pin',
      featured_image_id: null,
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

  it('defaults the icon to Pin when none is submitted', async () => {
    const data = announcementForm()
    data.delete('icon')

    const state = await createAnnouncementAction.execute({ user: userWithPermission(true), db }, data)

    expect(state).toEqual({ status: 'success' })
    const rows = await db.select().from(announcements).where(eq(announcements.title, 'Ensaio do coral'))
    expect(rows[0]?.icon).toBe('Pin')
  })

  it('stores an icon chosen from the curated catalog', async () => {
    await createAnnouncementAction.execute(
      { user: userWithPermission(true), db },
      announcementForm({ icon: 'Megaphone' })
    )

    const rows = await db.select().from(announcements).where(eq(announcements.title, 'Ensaio do coral'))
    expect(rows[0]?.icon).toBe('Megaphone')
  })

  it('rejects an icon outside the curated catalog without writing', async () => {
    const state = await createAnnouncementAction.execute(
      { user: userWithPermission(true), db },
      announcementForm({ icon: 'Skull' })
    )

    expect(state.status).toBe('error')
    if (state.status === 'error') {
      expect(state.fieldErrors?.icon).toEqual(['Ícone inválido'])
    }
    expect(await db.select().from(announcements).where(isNull(announcements.deleted_at))).toEqual([])
  })

  it('links an existing featured image by id', async () => {
    const image = await seedFeaturedImage(db)

    await createAnnouncementAction.execute(
      { user: userWithPermission(true), db },
      announcementForm({ featured_image_id: String(image.id) })
    )

    const rows = await db.select().from(announcements).where(eq(announcements.title, 'Ensaio do coral'))
    expect(rows[0]?.featured_image_id).toBe(image.id)
  })

  it('creates an agenda item atomically when Adicionar à Agenda is checked and permitted', async () => {
    const user = userWithPermission((entity) => entity === 'announcements' || entity === 'agenda')

    const state = await createAnnouncementAction.execute(
      { user, db },
      announcementForm({ title: 'Bazar beneficente', expires_at: '2026-07-12', add_to_agenda: 'on' })
    )

    expect(state).toEqual({ status: 'success' })
    const agendaRows = await db.select().from(agenda).where(eq(agenda.title, 'Bazar beneficente'))
    expect(agendaRows).toHaveLength(1)
    expect(agendaRows[0]).toMatchObject({ description: null, time: null })
    expect(agendaRows[0]?.event_date.toISOString().slice(0, 10)).toBe('2026-07-12')
  })

  it('creates the agenda item for a past expires_at date', async () => {
    const user = userWithPermission((entity) => entity === 'announcements' || entity === 'agenda')

    await createAnnouncementAction.execute(
      { user, db },
      announcementForm({ title: 'Evento passado', expires_at: '2020-01-02', add_to_agenda: 'on' })
    )

    const agendaRows = await db.select().from(agenda).where(eq(agenda.title, 'Evento passado'))
    expect(agendaRows[0]?.event_date.toISOString().slice(0, 10)).toBe('2020-01-02')
  })

  it('does not create an agenda item when Adicionar à Agenda is left unchecked', async () => {
    const user = userWithPermission((entity) => entity === 'announcements' || entity === 'agenda')

    await createAnnouncementAction.execute({ user, db }, announcementForm({ title: 'Sem agenda' }))

    expect(await db.select().from(agenda)).toEqual([])
  })

  it('aborts both the announcement and the agenda item when the user cannot create agenda items', async () => {
    const user = userWithPermission((entity) => entity === 'announcements')

    const state = await createAnnouncementAction.execute(
      { user, db },
      announcementForm({ title: 'Sem permissão de agenda', add_to_agenda: 'on' })
    )

    expect(state).toEqual({
      status: 'error',
      formError: 'Você não tem permissão para executar esta ação.',
    })
    expect(await db.select().from(announcements).where(isNull(announcements.deleted_at))).toEqual([])
    expect(await db.select().from(agenda)).toEqual([])
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

  it('updates the icon', async () => {
    await seedAnnouncements(db, [{ title: 'Original', expires_at: '2026-07-12' }])
    const [announcement] = await db.select().from(announcements).where(eq(announcements.title, 'Original'))

    await updateAnnouncementAction.execute(
      { user: userWithPermission(true), db },
      announcementForm({ id: String(announcement.id), icon: 'Church' })
    )

    const rows = await db.select().from(announcements).where(eq(announcements.id, announcement.id))
    expect(rows[0]?.icon).toBe('Church')
  })

  it('rejects an icon outside the curated catalog without writing', async () => {
    await seedAnnouncements(db, [{ title: 'Original', expires_at: '2026-07-12' }])
    const [announcement] = await db.select().from(announcements).where(eq(announcements.title, 'Original'))

    const state = await updateAnnouncementAction.execute(
      { user: userWithPermission(true), db },
      announcementForm({ id: String(announcement.id), icon: 'Skull' })
    )

    expect(state.status).toBe('error')
    if (state.status === 'error') {
      expect(state.fieldErrors?.icon).toEqual(['Ícone inválido'])
    }
    const rows = await db.select().from(announcements).where(eq(announcements.id, announcement.id))
    expect(rows[0]?.icon).toBe('Pin')
  })

  it('links and later removes a featured image', async () => {
    await seedAnnouncements(db, [{ title: 'Original', expires_at: '2026-07-12' }])
    const [announcement] = await db.select().from(announcements).where(eq(announcements.title, 'Original'))
    const image = await seedFeaturedImage(db)

    await updateAnnouncementAction.execute(
      { user: userWithPermission(true), db },
      announcementForm({ id: String(announcement.id), featured_image_id: String(image.id) })
    )

    let rows = await db.select().from(announcements).where(eq(announcements.id, announcement.id))
    expect(rows[0]?.featured_image_id).toBe(image.id)

    await updateAnnouncementAction.execute(
      { user: userWithPermission(true), db },
      announcementForm({ id: String(announcement.id), featured_image_id: '' })
    )

    rows = await db.select().from(announcements).where(eq(announcements.id, announcement.id))
    expect(rows[0]?.featured_image_id).toBeNull()
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
