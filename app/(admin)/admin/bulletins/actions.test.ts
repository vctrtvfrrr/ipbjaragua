import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { bulletins } from '@/db/schema'
import type { CurrentUser } from '@/lib/auth/current-user'
import { formatISODate, parseISODate } from '@/lib/date'
import { createTestDb, type TestDb } from '@/tests/db'
import { seedArticles, seedBulletins } from '@/tests/seed'
import { createBulletinAction, deleteBulletinAction, updateBulletinAction } from './actions'
import { nextBulletinEdition } from '@/db/queries/bulletins-write'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

function formData(entries: [string, string][]) {
  const data = new FormData()
  for (const [name, value] of entries) data.append(name, value)
  return data
}

function bulletinForm(overrides: Partial<Record<string, string>> = {}) {
  return formData(
    Object.entries({
      title: 'Boletim Dominical',
      date: '2026-07-12',
      edition: '72',
      article_id: '',
      show_announcements: 'on',
      show_agenda: 'on',
      show_birthdays: 'on',
      ...overrides,
    }).filter((entry) => entry[1] !== 'omit')
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

describe('createBulletinAction.execute', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
    vi.mocked(revalidatePath).mockClear()
  })

  it('denies users without bulletin create permission without writing', async () => {
    const user = userWithPermission(false)

    const state = await createBulletinAction.execute({ user, db }, bulletinForm())

    expect(state).toEqual({
      status: 'error',
      formError: 'Você não tem permissão para executar esta ação.',
    })
    expect(user.can).toHaveBeenCalledWith('bulletins', 'create')
    expect(await db.select().from(bulletins)).toEqual([])
  })

  it('requires a title without writing', async () => {
    const state = await createBulletinAction.execute(
      { user: userWithPermission(true), db },
      bulletinForm({ title: '' })
    )

    expect(state).toEqual({
      status: 'error',
      fieldErrors: { title: ['Título é obrigatório'] },
      formError: undefined,
    })
    expect(await db.select().from(bulletins)).toEqual([])
  })

  it('inserts a bulletin for users with bulletin create permission', async () => {
    const [articleId] = await seedArticles(db, [{ slug: 'pastoral', title: 'Pastoral', date: '2026-07-01' }])

    const state = await createBulletinAction.execute(
      { user: userWithPermission(true), db },
      bulletinForm({ article_id: String(articleId), show_agenda: 'omit' })
    )

    expect(state).toEqual({ status: 'success' })
    const rows = await db
      .select()
      .from(bulletins)
      .where(eq(bulletins.date, parseISODate('2026-07-12')))
    expect(rows[0]).toMatchObject({
      title: 'Boletim Dominical',
      edition: 72,
      article_id: articleId,
      show_announcements: true,
      show_agenda: false,
      show_birthdays: true,
    })
    expect(revalidatePath).toHaveBeenCalledWith('/')
    expect(revalidatePath).toHaveBeenCalledWith('/bulletins')
    expect(revalidatePath).toHaveBeenCalledWith('/bulletins/2026-07-12')
  })

  it('translates unique date and edition violations', async () => {
    await seedBulletins(db, [{ date: '2026-07-12', edition: 72 }])

    const sameDate = await createBulletinAction.execute(
      { user: userWithPermission(true), db },
      bulletinForm({ edition: '73' })
    )
    const sameEdition = await createBulletinAction.execute(
      { user: userWithPermission(true), db },
      bulletinForm({ date: '2026-07-19' })
    )

    expect(sameDate).toEqual({ status: 'error', formError: 'Já existe um boletim nessa data.' })
    expect(sameEdition).toEqual({ status: 'error', formError: 'Já existe um boletim com essa edição.' })
  })
})

describe('nextBulletinEdition', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('suggests max edition plus one across published and draft bulletins', async () => {
    await seedBulletins(db, [
      { date: '2026-07-05', edition: 71 },
      { date: '2026-07-26', edition: 80 },
    ])

    expect(await nextBulletinEdition(db)).toBe(81)
  })
})

describe('updateBulletinAction.execute', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-20T12:00:00Z'))
    vi.mocked(revalidatePath).mockClear()
  })

  it('updates editable fields outside the correction window', async () => {
    await seedBulletins(db, [{ date: '2026-07-05', edition: 71, created_at: '2026-07-01T00:00:00Z' }])
    const [row] = await db
      .select()
      .from(bulletins)
      .where(eq(bulletins.date, parseISODate('2026-07-05')))

    const state = await updateBulletinAction.execute(
      { user: userWithPermission(true), db },
      bulletinForm({
        id: String(row.id),
        oldDate: '2026-07-05',
        date: '2026-07-05',
        edition: '71',
        title: 'Boletim Atualizado',
        show_birthdays: 'omit',
      })
    )

    expect(state).toEqual({ status: 'success' })
    const [updated] = await db.select().from(bulletins).where(eq(bulletins.id, row.id))
    expect(updated.title).toBe('Boletim Atualizado')
    expect(updated.show_birthdays).toBe(false)
  })

  it('blocks date changes outside the correction window', async () => {
    await seedBulletins(db, [{ date: '2026-07-05', edition: 71, created_at: '2026-07-01T00:00:00Z' }])
    const [row] = await db
      .select()
      .from(bulletins)
      .where(eq(bulletins.date, parseISODate('2026-07-05')))

    const state = await updateBulletinAction.execute(
      { user: userWithPermission(true), db },
      bulletinForm({ id: String(row.id), oldDate: '2026-07-05', date: '2026-07-06', edition: '71' })
    )

    expect(state).toEqual({
      status: 'error',
      formError: 'Este boletim está fora da Janela de Correção para alterar a data ou excluir.',
    })
    const [unchanged] = await db.select().from(bulletins).where(eq(bulletins.id, row.id))
    expect(formatISODate(unchanged.date)).toBe('2026-07-05')
  })
})

describe('deleteBulletinAction.execute', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-20T12:00:00Z'))
    vi.mocked(revalidatePath).mockClear()
  })

  it('hard-deletes a bulletin inside the correction window', async () => {
    await seedBulletins(db, [{ date: '2026-07-26', edition: 72, created_at: '2026-07-01T00:00:00Z' }])
    const [row] = await db
      .select()
      .from(bulletins)
      .where(eq(bulletins.date, parseISODate('2026-07-26')))

    const state = await deleteBulletinAction.execute(
      { user: userWithPermission(true), db },
      formData([['id', String(row.id)]])
    )

    expect(state).toEqual({ status: 'success' })
    expect(await db.select().from(bulletins).where(eq(bulletins.id, row.id))).toEqual([])
    expect(revalidatePath).toHaveBeenCalledWith('/bulletins/2026-07-26')
  })

  it('blocks deletion outside the correction window', async () => {
    await seedBulletins(db, [{ date: '2026-07-05', edition: 71, created_at: '2026-07-01T00:00:00Z' }])
    const [row] = await db
      .select()
      .from(bulletins)
      .where(eq(bulletins.date, parseISODate('2026-07-05')))

    const state = await deleteBulletinAction.execute(
      { user: userWithPermission(true), db },
      formData([['id', String(row.id)]])
    )

    expect(state).toEqual({
      status: 'error',
      formError: 'Este boletim está fora da Janela de Correção para alterar a data ou excluir.',
    })
    expect(await db.select().from(bulletins).where(eq(bulletins.id, row.id))).toHaveLength(1)
  })
})
