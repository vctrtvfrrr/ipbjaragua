import { mkdtemp, readdir, rm, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { approveMeetingMinute, createMeetingMinute, getMeetingMinuteById } from '@/db/queries/meeting-minutes'
import type { CurrentUser } from '@/lib/auth/current-user'
import { readMeetingMinutePdfCache, writeMeetingMinutePdfCache } from '@/lib/meeting-minute-pdf-cache'
import {
  ensureMeetingMinutePdfCache,
  generateMeetingMinutePdf,
  regenerateMeetingMinutePdfCache,
} from '@/lib/meeting-minute-pdf'
import { meetingMinuteBookBySlug } from '@/lib/meeting-minute-books'
import { closeSharedBrowser } from '@/lib/pdf/browser'
import { createTestDb, type TestDb } from '@/tests/db'

const MESA = meetingMinuteBookBySlug('mesa-administrativa')!
const MUSICA = meetingMinuteBookBySlug('secretaria-de-musica')!

function user(permissions: 'read' | 'none', scope = MESA.slug): CurrentUser {
  return {
    id: 1,
    email: 'ana@example.com',
    name: 'Ana',
    can: vi.fn(
      (_entity, action, requestedScope) => permissions === 'read' && action === 'read' && requestedScope === scope
    ),
  }
}

function minute(overrides: Record<string, unknown> = {}) {
  return {
    book: MESA.slug,
    number: 12,
    title: 'IPB de Jaraguá do Sul',
    started_at: new Date('2026-06-07T22:30:00Z'),
    ended_at: new Date('2026-06-08T00:00:00Z'),
    location: 'Salão social',
    attendees: '- Pastor João',
    opening: 'A reunião foi aberta com oração.',
    closing: 'Nada mais havendo a tratar.',
    topics: [{ title: 'Orçamento', discussion: 'O orçamento anual foi aprovado.' }],
    ...overrides,
  }
}

let db: TestDb
let storagePath: string

function cacheDirectory(): string {
  return path.join(storagePath, 'meeting-minute-pdfs')
}

const MARKER = '%PDF-1.7 cache antigo'

// The old bytes are made recognizable so a later read proves itself: anything that came out
// of Chromium would be a real document, and this one deliberately is not.
async function writeMarker(name: string): Promise<void> {
  await writeMeetingMinutePdfCache(name, Buffer.from(MARKER))
}

async function approvedMinute(overrides: Record<string, unknown> = {}): Promise<number> {
  const created = await createMeetingMinute(minute(overrides), db)
  await approveMeetingMinute(created.id, db)

  return created.id
}

beforeEach(async () => {
  db = await createTestDb()
  storagePath = await mkdtemp(path.join(tmpdir(), 'meeting-minute-pdf-'))
  process.env.MEDIA_STORAGE_PATH = storagePath
})

afterEach(async () => {
  delete process.env.MEDIA_STORAGE_PATH
  await rm(storagePath, { recursive: true, force: true })
})

afterAll(async () => {
  await closeSharedBrowser()
})

describe('generateMeetingMinutePdf', () => {
  it('refuses a request without an active session', async () => {
    expect(await generateMeetingMinutePdf(null, MESA, 1, db)).toEqual({ status: 'forbidden' })
  })

  it('refuses a Usuário without read on that Livro', async () => {
    const reader = user('none')

    expect(await generateMeetingMinutePdf(reader, MESA, 1, db)).toEqual({ status: 'forbidden' })
    expect(reader.can).toHaveBeenCalledWith('meeting_minutes', 'read', MESA.slug)
  })

  it('reports an Ata that does not exist', async () => {
    expect(await generateMeetingMinutePdf(user('read'), MESA, 404, db)).toEqual({ status: 'not-found' })
    expect(await generateMeetingMinutePdf(user('read'), MESA, Number('abc'), db)).toEqual({ status: 'not-found' })
  })

  it('reports as not found an Ata that belongs to another Livro', async () => {
    const created = await createMeetingMinute(minute(), db)

    expect(await generateMeetingMinutePdf(user('read', MUSICA.slug), MUSICA, created.id, db)).toEqual({
      status: 'not-found',
    })
  })

  it('returns the document named after the Número', { timeout: 60_000 }, async () => {
    const created = await createMeetingMinute(minute(), db)

    const result = await generateMeetingMinutePdf(user('read'), MESA, created.id, db)

    expect(result).toMatchObject({ status: 'ok', filename: 'ata-12.pdf' })
    expect(result.status === 'ok' && result.pdf.subarray(0, 5).toString()).toBe('%PDF-')
  })

  it('fails visibly instead of dropping an image it may not fetch', { timeout: 60_000 }, async () => {
    const created = await createMeetingMinute(
      minute({ opening: 'Aberta com ![diagrama](https://localhost/diagrama.png) em anexo.' }),
      db
    )

    expect(await generateMeetingMinutePdf(user('read'), MESA, created.id, db)).toEqual({
      status: 'failed',
      message: expect.stringContaining('o destino não é um endereço público'),
    })
  })
})

describe('the PDF cache of an Ata Aprovada', () => {
  it('is built and stored the first time the Ata is read', { timeout: 60_000 }, async () => {
    const id = await approvedMinute()

    const result = await generateMeetingMinutePdf(user('read'), MESA, id, db)

    expect(result).toMatchObject({ status: 'ok', filename: 'ata-12.pdf' })
    const stored = (await getMeetingMinuteById(id, db))?.pdf_path
    expect(stored).toMatch(/^[a-f0-9]{48}\.pdf$/)
    expect(await readMeetingMinutePdfCache(stored!)).toEqual(result.status === 'ok' ? result.pdf : null)
  })

  it('serves the stored bytes again instead of rebuilding them', { timeout: 60_000 }, async () => {
    const id = await approvedMinute()
    await ensureMeetingMinutePdfCache(id, MESA, db)
    const stored = (await getMeetingMinuteById(id, db))!.pdf_path!
    await writeMarker(stored)

    const result = await generateMeetingMinutePdf(user('read'), MESA, id, db)

    expect(result.status === 'ok' && result.pdf.toString()).toBe(MARKER)
  })

  it('rebuilds the document when the volume lost the file', { timeout: 60_000 }, async () => {
    const id = await approvedMinute()
    await ensureMeetingMinutePdfCache(id, MESA, db)
    const stored = (await getMeetingMinuteById(id, db))!.pdf_path!
    await unlink(path.join(cacheDirectory(), stored))

    const result = await generateMeetingMinutePdf(user('read'), MESA, id, db)

    expect(result.status === 'ok' && result.pdf.subarray(0, 5).toString()).toBe('%PDF-')
    expect((await getMeetingMinuteById(id, db))?.pdf_path).toBe(stored)
  })

  it('leaves an existing cache untouched when the Aprovação is repeated', { timeout: 60_000 }, async () => {
    const id = await approvedMinute()
    await ensureMeetingMinutePdfCache(id, MESA, db)
    const stored = (await getMeetingMinuteById(id, db))!.pdf_path!
    await writeMarker(stored)

    await ensureMeetingMinutePdfCache(id, MESA, db)

    expect((await readMeetingMinutePdfCache(stored))?.toString()).toBe(MARKER)
  })

  it('replaces the stored bytes when the Regeneração is confirmed', { timeout: 60_000 }, async () => {
    const id = await approvedMinute()
    await ensureMeetingMinutePdfCache(id, MESA, db)
    const stored = (await getMeetingMinuteById(id, db))!.pdf_path!
    await writeMarker(stored)

    await regenerateMeetingMinutePdfCache(id, MESA, db)

    const rebuilt = await readMeetingMinutePdfCache(stored)
    expect(rebuilt?.subarray(0, 5).toString()).toBe('%PDF-')
    expect(await readdir(cacheDirectory())).toEqual([stored])
  })

  it('lets the last of two simultaneous Regenerações stand', { timeout: 120_000 }, async () => {
    const id = await approvedMinute()

    await Promise.all([regenerateMeetingMinutePdfCache(id, MESA, db), regenerateMeetingMinutePdfCache(id, MESA, db)])

    const stored = (await getMeetingMinuteById(id, db))!.pdf_path!
    expect(await readdir(cacheDirectory())).toEqual([stored])
    expect((await readMeetingMinutePdfCache(stored))?.subarray(0, 5).toString()).toBe('%PDF-')
  })

  it('keeps the Ata Aprovada without a cache when the document fails', { timeout: 60_000 }, async () => {
    const id = await approvedMinute({ opening: 'Aberta com ![diagrama](https://localhost/diagrama.png) em anexo.' })

    await expect(ensureMeetingMinutePdfCache(id, MESA, db)).rejects.toThrow()

    expect((await getMeetingMinuteById(id, db))?.status).toBe('approved')
    expect(await readdir(cacheDirectory()).catch(() => [])).toEqual([])
  })
})
