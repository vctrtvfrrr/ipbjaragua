import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { asc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { meetingMinuteTopics, meetingMinutes } from '@/db/schema'
import type { CurrentUser } from '@/lib/auth/current-user'
import { readMeetingMinutePdfCache, writeMeetingMinutePdfCache } from '@/lib/meeting-minute-pdf-cache'
import { closeSharedBrowser } from '@/lib/pdf/browser'
import { createTestDb, type TestDb } from '@/tests/db'
import {
  approveMeetingMinuteAction,
  APPROVED_WITHOUT_PDF,
  createMeetingMinuteAction,
  regenerateMeetingMinutePdfAction,
  updateMeetingMinuteAction,
} from './actions'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

const MESA = 'mesa-administrativa'
const MUSICA = 'secretaria-de-musica'

function userWithScope(scope: string | null): CurrentUser {
  return {
    id: 1,
    email: 'ana@example.com',
    name: 'Ana',
    can: vi.fn((_entity, _action, requestedScope) => scope !== null && requestedScope === scope),
  }
}

function noPermission(): CurrentUser {
  return userWithScope(null)
}

function formData(payload: unknown) {
  const data = new FormData()
  data.append('payload', JSON.stringify(payload))
  return data
}

function payload(overrides: Record<string, unknown> = {}) {
  return {
    book: MESA,
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

  it('denies a user without create permission on the requested Livro without writing', async () => {
    const user = noPermission()

    const state = await createMeetingMinuteAction.execute({ user, db }, formData(payload()))

    expect(state).toEqual({ status: 'error', formError: 'Você não tem permissão para executar esta ação.' })
    expect(user.can).toHaveBeenCalledWith('meeting_minutes', 'create', MESA)
    expect(await db.select().from(meetingMinutes)).toEqual([])
  })

  it('denies a user with permission on a different Livro without writing', async () => {
    const user = userWithScope(MUSICA)

    const state = await createMeetingMinuteAction.execute({ user, db }, formData(payload({ book: MESA })))

    expect(state).toEqual({ status: 'error', formError: 'Você não tem permissão para executar esta ação.' })
    expect(await db.select().from(meetingMinutes)).toEqual([])
  })

  it('denies a request without a session', async () => {
    const state = await createMeetingMinuteAction.execute({ user: null, db }, formData(payload()))

    expect(state).toEqual({ status: 'error', formError: 'Sua sessão expirou. Faça login novamente.' })
    expect(await db.select().from(meetingMinutes)).toEqual([])
  })

  it('saves a complete Ata in its Livro, as Aprovação pendente, with its Tópicos in order', async () => {
    const state = await createMeetingMinuteAction.execute({ user: userWithScope(MESA), db }, formData(payload()))

    expect(state).toEqual({ status: 'success' })

    const [minute] = await db.select().from(meetingMinutes)
    expect(minute).toMatchObject({
      book: MESA,
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
    expect(revalidatePath).toHaveBeenCalledWith(`/admin/meeting-minutes/${MESA}`)
  })

  it('rejects an incomplete first save', async () => {
    const state = await createMeetingMinuteAction.execute(
      { user: userWithScope(MESA), db },
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
      { user: userWithScope(MESA), db },
      formData(payload({ topics: [{ title: '', discussion: '' }] }))
    )

    expect(state.status).toBe('error')
    expect(await db.select().from(meetingMinutes)).toEqual([])
  })

  it('rejects a Término that is not later than the Início', async () => {
    const state = await createMeetingMinuteAction.execute(
      { user: userWithScope(MESA), db },
      formData(payload({ ended_at: '2026-06-07T19:00' }))
    )

    expect(state.status).toBe('error')
    if (state.status !== 'error') throw new Error('expected an error state')
    expect(state.fieldErrors?.ended_at).toEqual(['O Término deve ser posterior ao Início'])
    expect(await db.select().from(meetingMinutes)).toEqual([])
  })

  it('reports a Número already taken in the same Livro', async () => {
    const user = userWithScope(MESA)
    await createMeetingMinuteAction.execute({ user, db }, formData(payload({ number: 4 })))

    const state = await createMeetingMinuteAction.execute(
      { user, db },
      formData(payload({ number: 4, started_at: '2026-07-05T19:30', ended_at: '2026-07-05T21:00' }))
    )

    expect(state).toEqual({ status: 'error', formError: 'Já existe uma Ata com esse Número.' })
    expect(await db.select().from(meetingMinutes)).toHaveLength(1)
  })

  it('accepts the same Número in a different Livro', async () => {
    await createMeetingMinuteAction.execute(
      { user: userWithScope(MESA), db },
      formData(payload({ book: MESA, number: 1 }))
    )

    const state = await createMeetingMinuteAction.execute(
      { user: userWithScope(MUSICA), db },
      formData(payload({ book: MUSICA, number: 1 }))
    )

    expect(state).toEqual({ status: 'success' })
    expect(await db.select().from(meetingMinutes)).toHaveLength(2)
  })
})

describe('updateMeetingMinuteAction.execute', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
    vi.mocked(revalidatePath).mockClear()
  })

  async function seed(overrides: Record<string, unknown> = {}) {
    const state = await createMeetingMinuteAction.execute(
      { user: userWithScope((overrides.book as string) ?? MESA), db },
      formData(payload(overrides))
    )
    if (state.status !== 'success') throw new Error('expected the seed to succeed')

    const [minute] = await db.select().from(meetingMinutes)
    return minute
  }

  it('denies a user without update permission on the Ata Livro without writing', async () => {
    const minute = await seed()
    const user = noPermission()

    const state = await updateMeetingMinuteAction.execute(
      { user, db },
      formData(payload({ id: minute.id, title: 'Nova' }))
    )

    expect(state).toEqual({ status: 'error', formError: 'Você não tem permissão para executar esta ação.' })

    const [current] = await db.select().from(meetingMinutes)
    expect(current.title).toBe('IPB de Jaraguá do Sul')
  })

  it('denies a user with permission on a different Livro from the Ata being edited', async () => {
    const minute = await seed()
    const user = userWithScope(MUSICA)

    const state = await updateMeetingMinuteAction.execute(
      { user, db },
      formData(payload({ id: minute.id, title: 'Nova' }))
    )

    expect(state).toEqual({ status: 'error', formError: 'Você não tem permissão para executar esta ação.' })
  })

  it('denies a request without a session', async () => {
    const minute = await seed()

    const state = await updateMeetingMinuteAction.execute({ user: null, db }, formData(payload({ id: minute.id })))

    expect(state).toEqual({ status: 'error', formError: 'Sua sessão expirou. Faça login novamente.' })
  })

  it('rewrites every field of a Pendente Ata, keeping its identity and Livro', async () => {
    const minute = await seed()

    const state = await updateMeetingMinuteAction.execute(
      { user: userWithScope(MESA), db },
      formData(
        payload({
          id: minute.id,
          number: 9,
          title: 'Ata reformulada',
          started_at: '2026-06-14T18:00',
          ended_at: '2026-06-14T19:30',
          location: 'Sala de reuniões',
          attendees: '- Presbítero Pedro',
          opening: 'Aberta com leitura bíblica.',
          closing: 'Encerrada com oração.',
        })
      )
    )

    expect(state).toEqual({ status: 'success' })

    const [current] = await db.select().from(meetingMinutes)
    expect(current).toMatchObject({
      id: minute.id,
      book: MESA,
      number: 9,
      title: 'Ata reformulada',
      location: 'Sala de reuniões',
      attendees: '- Presbítero Pedro',
      opening: 'Aberta com leitura bíblica.',
      closing: 'Encerrada com oração.',
      status: 'pending',
    })
    expect(current.started_at.toISOString()).toBe('2026-06-14T21:00:00.000Z')
    expect(revalidatePath).toHaveBeenCalledWith(`/admin/meeting-minutes/${MESA}`)
  })

  it('ignores a Livro sent along with the update, keeping the original', async () => {
    const minute = await seed({ book: MUSICA })

    const state = await updateMeetingMinuteAction.execute(
      { user: userWithScope(MUSICA), db },
      formData(payload({ id: minute.id, book: MESA, title: 'Tentativa de mudar de Livro' }))
    )

    expect(state).toEqual({ status: 'success' })
    const [current] = await db.select().from(meetingMinutes)
    expect(current.book).toBe(MUSICA)
  })

  it('persists Tópicos added, removed and reordered', async () => {
    const minute = await seed()

    const state = await updateMeetingMinuteAction.execute(
      { user: userWithScope(MESA), db },
      formData(
        payload({
          id: minute.id,
          topics: [
            { title: 'Reforma', discussion: 'Retomada.' },
            { title: 'Missões', discussion: 'Novo Tópico.' },
          ],
        })
      )
    )

    expect(state).toEqual({ status: 'success' })

    const topics = await db
      .select({ position: meetingMinuteTopics.position, title: meetingMinuteTopics.title })
      .from(meetingMinuteTopics)
      .where(eq(meetingMinuteTopics.meeting_minute_id, minute.id))
      .orderBy(asc(meetingMinuteTopics.position))
    expect(topics).toEqual([
      { position: 0, title: 'Reforma' },
      { position: 1, title: 'Missões' },
    ])
  })

  it('applies the same required validations as the creation', async () => {
    const minute = await seed()

    const state = await updateMeetingMinuteAction.execute(
      { user: userWithScope(MESA), db },
      formData(payload({ id: minute.id, location: '', opening: '**  **', topics: [] }))
    )

    expect(state.status).toBe('error')
    if (state.status !== 'error') throw new Error('expected an error state')
    expect(Object.keys(state.fieldErrors ?? {})).toEqual(['location', 'opening', 'topics'])
    expect(state.formError).toBe('Revise a Ata antes de salvar.')
  })

  it('accepts keeping the same Número the Ata already has', async () => {
    const minute = await seed()

    const state = await updateMeetingMinuteAction.execute(
      { user: userWithScope(MESA), db },
      formData(payload({ id: minute.id, number: 1, title: 'Mesmo Número' }))
    )

    expect(state).toEqual({ status: 'success' })
  })

  it('reports a Número taken by another Ata of the same Livro and keeps the original intact', async () => {
    const minute = await seed()
    await createMeetingMinuteAction.execute(
      { user: userWithScope(MESA), db },
      formData(payload({ number: 2, started_at: '2026-07-05T19:30', ended_at: '2026-07-05T21:00' }))
    )

    const state = await updateMeetingMinuteAction.execute(
      { user: userWithScope(MESA), db },
      formData(payload({ id: minute.id, number: 2 }))
    )

    expect(state).toEqual({ status: 'error', formError: 'Já existe uma Ata com esse Número.' })

    const [current] = await db.select().from(meetingMinutes).where(eq(meetingMinutes.id, minute.id))
    expect(current.number).toBe(1)
  })

  it('rejects editing an Ata Aprovada', async () => {
    const minute = await seed()
    await db.update(meetingMinutes).set({ status: 'approved' }).where(eq(meetingMinutes.id, minute.id))

    const state = await updateMeetingMinuteAction.execute(
      { user: userWithScope(MESA), db },
      formData(payload({ id: minute.id, title: 'Tarde demais' }))
    )

    expect(state).toEqual({ status: 'error', formError: 'Somente Atas Pendentes de aprovação podem ser editadas.' })

    const [current] = await db.select().from(meetingMinutes)
    expect(current.title).toBe('IPB de Jaraguá do Sul')
  })

  it('reports an Ata that does not exist', async () => {
    const state = await updateMeetingMinuteAction.execute(
      { user: userWithScope(MESA), db },
      formData(payload({ id: 999 }))
    )

    expect(state).toEqual({ status: 'error', formError: 'Ata não encontrada.' })
  })
})

describe('approving an Ata and keeping its PDF', () => {
  let db: TestDb
  let storagePath: string

  function cacheDirectory(): string {
    return path.join(storagePath, 'meeting-minute-pdfs')
  }

  function idFormData(id: number) {
    const data = new FormData()
    data.append('id', String(id))
    return data
  }

  async function seed(overrides: Record<string, unknown> = {}) {
    const state = await createMeetingMinuteAction.execute(
      { user: userWithScope(MESA), db },
      formData(payload(overrides))
    )
    if (state.status !== 'success') throw new Error('expected the seed to succeed')

    const [minute] = await db.select().from(meetingMinutes)
    return minute
  }

  async function storedPdfPath(id: number): Promise<string> {
    const [minute] = await db.select().from(meetingMinutes).where(eq(meetingMinutes.id, id))
    if (!minute.pdf_path) throw new Error('expected the Ata to carry a cache path')

    return minute.pdf_path
  }

  beforeEach(async () => {
    db = await createTestDb()
    vi.mocked(revalidatePath).mockClear()
    storagePath = await mkdtemp(path.join(tmpdir(), 'meeting-minute-actions-'))
    process.env.MEDIA_STORAGE_PATH = storagePath
  })

  afterEach(async () => {
    delete process.env.MEDIA_STORAGE_PATH
    await rm(storagePath, { recursive: true, force: true })
  })

  afterAll(async () => {
    await closeSharedBrowser()
  })

  it('denies a Usuário without update permission on the Livro and leaves the Ata Pendente', async () => {
    const minute = await seed()
    const user = noPermission()

    const state = await approveMeetingMinuteAction.execute({ user, db }, idFormData(minute.id))

    expect(state).toEqual({ status: 'error', formError: 'Você não tem permissão para executar esta ação.' })
    expect((await db.select().from(meetingMinutes))[0].status).toBe('pending')
  })

  it('denies a request without a session', async () => {
    const minute = await seed()

    const state = await approveMeetingMinuteAction.execute({ user: null, db }, idFormData(minute.id))

    expect(state).toEqual({ status: 'error', formError: 'Sua sessão expirou. Faça login novamente.' })
    expect((await db.select().from(meetingMinutes))[0].status).toBe('pending')
  })

  it('consolidates the Ata and stores its PDF', { timeout: 60_000 }, async () => {
    const minute = await seed()

    const state = await approveMeetingMinuteAction.execute({ user: userWithScope(MESA), db }, idFormData(minute.id))

    expect(state).toEqual({ status: 'success' })
    expect((await db.select().from(meetingMinutes))[0].status).toBe('approved')
    const stored = await readMeetingMinutePdfCache(await storedPdfPath(minute.id))
    expect(stored?.subarray(0, 5).toString()).toBe('%PDF-')
    expect(revalidatePath).toHaveBeenCalledWith(`/admin/meeting-minutes/${MESA}`)
  })

  it('keeps the Aprovação when the document fails and says to try the PDF again', { timeout: 60_000 }, async () => {
    const minute = await seed({ opening: 'Aberta com ![diagrama](https://localhost/diagrama.png) em anexo.' })

    const state = await approveMeetingMinuteAction.execute({ user: userWithScope(MESA), db }, idFormData(minute.id))

    expect(state).toEqual({ status: 'success', warning: APPROVED_WITHOUT_PDF })
    expect((await db.select().from(meetingMinutes))[0].status).toBe('approved')
    expect(await readdir(cacheDirectory()).catch(() => [])).toEqual([])
  })

  it('adds nothing when the Aprovação is repeated', { timeout: 60_000 }, async () => {
    const minute = await seed()
    const user = userWithScope(MESA)
    await approveMeetingMinuteAction.execute({ user, db }, idFormData(minute.id))
    const stored = await storedPdfPath(minute.id)
    await writeMeetingMinutePdfCache(stored, Buffer.from('%PDF-1.7 cache antigo'))

    const state = await approveMeetingMinuteAction.execute({ user, db }, idFormData(minute.id))

    expect(state).toEqual({ status: 'success' })
    expect(await storedPdfPath(minute.id)).toBe(stored)
    expect((await readMeetingMinutePdfCache(stored))?.toString()).toBe('%PDF-1.7 cache antigo')
  })

  it('does not build the document a repeat found missing', { timeout: 60_000 }, async () => {
    const minute = await seed()
    const user = userWithScope(MESA)
    await approveMeetingMinuteAction.execute({ user, db }, idFormData(minute.id))
    const stored = await storedPdfPath(minute.id)
    await rm(path.join(cacheDirectory(), stored))

    const state = await approveMeetingMinuteAction.execute({ user, db }, idFormData(minute.id))

    expect(state).toEqual({ status: 'success' })
    expect(await readdir(cacheDirectory())).toEqual([])
  })

  it('never reports a committed Aprovação as a failed one', { timeout: 60_000 }, async () => {
    const minute = await seed()
    vi.mocked(revalidatePath).mockImplementationOnce(() => {
      throw new Error('revalidation is unavailable')
    })

    const state = await approveMeetingMinuteAction.execute({ user: userWithScope(MESA), db }, idFormData(minute.id))

    expect(state.status).toBe('success')
    expect((await db.select().from(meetingMinutes))[0].status).toBe('approved')
    expect((await readMeetingMinutePdfCache(await storedPdfPath(minute.id)))?.subarray(0, 5).toString()).toBe('%PDF-')
  })

  it('reports an Ata that does not exist', async () => {
    const state = await approveMeetingMinuteAction.execute({ user: userWithScope(MESA), db }, idFormData(999))

    expect(state).toEqual({ status: 'error', formError: 'Ata não encontrada.' })
  })

  it('lets a Usuário with read replace the stored PDF', { timeout: 60_000 }, async () => {
    const minute = await seed()
    await approveMeetingMinuteAction.execute({ user: userWithScope(MESA), db }, idFormData(minute.id))
    const stored = await storedPdfPath(minute.id)
    await writeMeetingMinutePdfCache(stored, Buffer.from('%PDF-1.7 cache antigo'))

    const state = await regenerateMeetingMinutePdfAction.execute(
      { user: userWithScope(MESA), db },
      idFormData(minute.id)
    )

    expect(state).toEqual({ status: 'success' })
    expect((await readMeetingMinutePdfCache(stored))?.toString()).not.toBe('%PDF-1.7 cache antigo')
    expect(await readdir(cacheDirectory())).toEqual([stored])
  })

  it('denies a Regeneração from a Usuário without read on that Livro', async () => {
    const minute = await seed()
    const user = noPermission()

    const state = await regenerateMeetingMinutePdfAction.execute({ user, db }, idFormData(minute.id))

    expect(state).toEqual({ status: 'error', formError: 'Você não tem permissão para executar esta ação.' })
  })

  it('refuses to store a PDF for an Ata still Pendente', async () => {
    const minute = await seed()

    const state = await regenerateMeetingMinutePdfAction.execute(
      { user: userWithScope(MESA), db },
      idFormData(minute.id)
    )

    expect(state).toEqual({ status: 'error', formError: 'Somente Atas Aprovadas mantêm um PDF armazenado.' })
    expect((await db.select().from(meetingMinutes))[0].pdf_path).toBeNull()
  })
})
