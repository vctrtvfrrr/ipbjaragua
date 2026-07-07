import { eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { agenda } from '@/db/schema'
import type { CurrentUser } from '@/lib/auth/current-user'
import { createTestDb, type TestDb } from '@/tests/db'
import { seedAgenda } from '@/tests/seed'
import { createAgendaAction, deleteAgendaAction, updateAgendaAction } from './actions'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

function formData(entries: [string, string][]) {
  const data = new FormData()
  for (const [name, value] of entries) data.append(name, value)
  return data
}

function agendaForm(overrides: Partial<Record<string, string>> = {}) {
  return formData(
    Object.entries({
      title: 'Ensaio do coral',
      description: '',
      event_date: '2026-07-12',
      time: '',
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

function expectAgendaRevalidation() {
  expect(revalidatePath).toHaveBeenCalledWith('/')
  expect(revalidatePath).toHaveBeenCalledWith('/bulletins/[date]', 'page')
  expect(revalidatePath).toHaveBeenCalledWith('/admin/agenda', 'page')
  expect(revalidatePath).toHaveBeenCalledWith('/admin/agenda/new')
  expect(revalidatePath).toHaveBeenCalledWith('/admin/agenda/[id]/edit', 'page')
}

describe('createAgendaAction.execute', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
    vi.mocked(revalidatePath).mockClear()
  })

  it('denies users without agenda create permission without writing', async () => {
    const user = userWithPermission(false)

    const state = await createAgendaAction.execute({ user, db }, agendaForm())

    expect(state).toEqual({
      status: 'error',
      formError: 'Você não tem permissão para executar esta ação.',
    })
    expect(user.can).toHaveBeenCalledWith('agenda', 'create')
    expect(await db.select().from(agenda).where(isNull(agenda.deleted_at))).toEqual([])
  })

  it('returns an event_date field error without writing', async () => {
    const state = await createAgendaAction.execute(
      { user: userWithPermission(true), db },
      agendaForm({ event_date: '' })
    )

    expect(state.status).toBe('error')
    if (state.status === 'error') {
      expect(state.fieldErrors?.event_date).toEqual(['Data é obrigatória'])
      expect(state.values?.event_date).toBe('')
    }
    expect(await db.select().from(agenda).where(isNull(agenda.deleted_at))).toEqual([])
  })

  it('inserts an event with null empty time and revalidates affected pages', async () => {
    const state = await createAgendaAction.execute({ user: userWithPermission(true), db }, agendaForm())

    expect(state).toEqual({ status: 'success' })
    const rows = await db.select().from(agenda).where(eq(agenda.title, 'Ensaio do coral'))
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      description: null,
      time: null,
    })
    expect(rows[0]?.event_date.toISOString().slice(0, 10)).toBe('2026-07-12')
    expectAgendaRevalidation()
  })

  it('accepts past event dates', async () => {
    const state = await createAgendaAction.execute(
      { user: userWithPermission(true), db },
      agendaForm({ event_date: '2020-01-02' })
    )

    expect(state).toEqual({ status: 'success' })
    const rows = await db.select().from(agenda).where(eq(agenda.title, 'Ensaio do coral'))
    expect(rows[0]?.event_date.toISOString().slice(0, 10)).toBe('2020-01-02')
  })
})

describe('updateAgendaAction.execute', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
    vi.mocked(revalidatePath).mockClear()
  })

  it('updates an event', async () => {
    await seedAgenda(db, [{ title: 'Original', event_date: '2026-07-12', time: '19:30' }])
    const [item] = await db.select().from(agenda).where(eq(agenda.title, 'Original'))

    const state = await updateAgendaAction.execute(
      { user: userWithPermission(true), db },
      agendaForm({ id: String(item.id), title: 'Atualizado', description: 'Com jantar', time: '20:00' })
    )

    expect(state).toEqual({ status: 'success' })
    const rows = await db.select().from(agenda).where(eq(agenda.id, item.id))
    expect(rows[0]).toMatchObject({ title: 'Atualizado', description: 'Com jantar', time: '20:00:00' })
    expectAgendaRevalidation()
  })
})

describe('deleteAgendaAction.execute', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
    vi.mocked(revalidatePath).mockClear()
  })

  it('denies users without agenda delete permission without writing', async () => {
    await seedAgenda(db, [{ title: 'Ativo', event_date: '2026-07-12' }])
    const [item] = await db.select().from(agenda).where(eq(agenda.title, 'Ativo'))
    const user = userWithPermission(false)

    const state = await deleteAgendaAction.execute({ user, db }, formData([['id', String(item.id)]]))

    expect(state).toEqual({
      status: 'error',
      formError: 'Você não tem permissão para executar esta ação.',
    })
    expect(user.can).toHaveBeenCalledWith('agenda', 'delete')
    const rows = await db.select().from(agenda).where(eq(agenda.id, item.id))
    expect(rows[0]?.deleted_at).toBeNull()
  })

  it('soft-deletes an event', async () => {
    await seedAgenda(db, [{ title: 'Ativo', event_date: '2026-07-12' }])
    const [item] = await db.select().from(agenda).where(eq(agenda.title, 'Ativo'))

    const state = await deleteAgendaAction.execute(
      { user: userWithPermission(true), db },
      formData([['id', String(item.id)]])
    )

    expect(state).toEqual({ status: 'success' })
    const rows = await db.select().from(agenda).where(eq(agenda.id, item.id))
    expect(rows[0]?.deleted_at).not.toBeNull()
    expectAgendaRevalidation()
  })
})
