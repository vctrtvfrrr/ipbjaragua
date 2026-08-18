import { asc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { meetingMinuteTopics, meetingMinutes } from '@/db/schema'
import type { CurrentUser } from '@/lib/auth/current-user'
import { createTestDb, type TestDb } from '@/tests/db'
import { createMeetingMinuteAction } from './actions'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

function userWithPermission(canReturn: boolean): CurrentUser {
  return {
    id: 1,
    email: 'ana@example.com',
    name: 'Ana',
    can: vi.fn(() => canReturn),
  }
}

function formData(payload: unknown) {
  const data = new FormData()
  data.append('payload', JSON.stringify(payload))
  return data
}

function payload(overrides: Record<string, unknown> = {}) {
  return {
    number: 1,
    title: 'IPB de Jaraguá do Sul',
    started_at: '2026-06-07T19:30',
    ended_at: '2026-06-07T21:00',
    location: 'Salão social',
    attendees: '- Pastor João\n- Presbítero Pedro',
    opening: 'A reunião foi aberta com oração.',
    closing: 'Nada mais havendo a tratar, a reunião foi encerrada.',
    topics: [
      { title: 'Orçamento', discussion: 'O orçamento anual foi aprovado.' },
      { title: 'Reforma', discussion: 'A reforma do telhado foi adiada.' },
    ],
    ...overrides,
  }
}

describe('createMeetingMinuteAction.execute', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
    vi.mocked(revalidatePath).mockClear()
  })

  it('denies a user without create permission without writing', async () => {
    const user = userWithPermission(false)

    const state = await createMeetingMinuteAction.execute({ user, db }, formData(payload()))

    expect(state).toEqual({ status: 'error', formError: 'Você não tem permissão para executar esta ação.' })
    expect(user.can).toHaveBeenCalledWith('meeting_minutes', 'create')
    expect(await db.select().from(meetingMinutes)).toEqual([])
  })

  it('denies a request without a session', async () => {
    const state = await createMeetingMinuteAction.execute({ user: null, db }, formData(payload()))

    expect(state).toEqual({ status: 'error', formError: 'Sua sessão expirou. Faça login novamente.' })
    expect(await db.select().from(meetingMinutes)).toEqual([])
  })

  it('saves a complete Ata as Pendente de aprovação with its Tópicos in order', async () => {
    const state = await createMeetingMinuteAction.execute({ user: userWithPermission(true), db }, formData(payload()))

    expect(state).toEqual({ status: 'success' })

    const [minute] = await db.select().from(meetingMinutes)
    expect(minute).toMatchObject({
      number: 1,
      title: 'IPB de Jaraguá do Sul',
      location: 'Salão social',
      status: 'pending',
    })
    expect(minute.started_at.toISOString()).toBe('2026-06-07T22:30:00.000Z')
    expect(minute.ended_at.toISOString()).toBe('2026-06-08T00:00:00.000Z')

    const topics = await db
      .select({ position: meetingMinuteTopics.position, title: meetingMinuteTopics.title })
      .from(meetingMinuteTopics)
      .where(eq(meetingMinuteTopics.meeting_minute_id, minute.id))
      .orderBy(asc(meetingMinuteTopics.position))
    expect(topics).toEqual([
      { position: 0, title: 'Orçamento' },
      { position: 1, title: 'Reforma' },
    ])
    expect(revalidatePath).toHaveBeenCalledWith('/admin/meeting-minutes')
  })

  it('rejects an incomplete first save', async () => {
    const state = await createMeetingMinuteAction.execute(
      { user: userWithPermission(true), db },
      formData(payload({ location: '', opening: '**  **', topics: [] }))
    )

    expect(state.status).toBe('error')
    if (state.status !== 'error') throw new Error('expected an error state')
    expect(Object.keys(state.fieldErrors ?? {})).toEqual(['location', 'opening', 'topics'])
    expect(state.formError).toBe('Revise a Ata antes de salvar.')
    expect(await db.select().from(meetingMinutes)).toEqual([])
  })

  it('rejects a Tópico without title or Discussão', async () => {
    const state = await createMeetingMinuteAction.execute(
      { user: userWithPermission(true), db },
      formData(payload({ topics: [{ title: '', discussion: '' }] }))
    )

    expect(state.status).toBe('error')
    expect(await db.select().from(meetingMinutes)).toEqual([])
  })

  it('rejects a Término that is not later than the Início', async () => {
    const state = await createMeetingMinuteAction.execute(
      { user: userWithPermission(true), db },
      formData(payload({ ended_at: '2026-06-07T19:00' }))
    )

    expect(state.status).toBe('error')
    if (state.status !== 'error') throw new Error('expected an error state')
    expect(state.fieldErrors?.ended_at).toEqual(['O Término deve ser posterior ao Início'])
    expect(await db.select().from(meetingMinutes)).toEqual([])
  })

  it('reports a Número already taken', async () => {
    const user = userWithPermission(true)
    await createMeetingMinuteAction.execute({ user, db }, formData(payload({ number: 4 })))

    const state = await createMeetingMinuteAction.execute(
      { user, db },
      formData(payload({ number: 4, started_at: '2026-07-05T19:30', ended_at: '2026-07-05T21:00' }))
    )

    expect(state).toEqual({ status: 'error', formError: 'Já existe uma Ata com esse Número.' })
    expect(await db.select().from(meetingMinutes)).toHaveLength(1)
  })
})
