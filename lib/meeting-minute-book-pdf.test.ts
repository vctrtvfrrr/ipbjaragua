import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { approveMeetingMinute, createMeetingMinute, getMeetingMinuteById } from '@/db/queries/meeting-minutes'
import type { CurrentUser } from '@/lib/auth/current-user'
import { parseChurchDateTime } from '@/lib/date'
import { MEETING_MINUTE_BOOK_FAILURE } from '@/lib/meeting-minute-book'
import {
  generateMeetingMinuteBook,
  meetingMinuteBookState,
  meetingMinuteBookSummary,
  type MeetingMinuteReader,
} from '@/lib/meeting-minute-book-pdf'
import { ensureMeetingMinutePdfCache } from '@/lib/meeting-minute-pdf'
import { writeMeetingMinutePdfCache } from '@/lib/meeting-minute-pdf-cache'
import { closeSharedBrowser, renderPdf, type PdfJobState } from '@/lib/pdf/browser'
import { createTestDb, type TestDb } from '@/tests/db'
import { pdfPageTexts } from '@/tests/pdf/pdf-text'

function user(permissions: 'read' | 'none'): CurrentUser {
  return {
    id: 1,
    email: 'ana@example.com',
    name: 'Ana',
    can: vi.fn((_entity, action) => permissions === 'read' && action === 'read'),
  }
}

const TOKEN = '0e1d2c3b-4a59-4867-8f90-a1b2c3d4e5f6'
const YEAR = { from: '2026-01-01', to: '2026-12-31', order: 'chronological' as const, token: TOKEN }

// The Livro asks who is asking again at every step, so a reader is a function, not a snapshot.
function reader(permissions: 'read' | 'none'): MeetingMinuteReader {
  const current = user(permissions)

  return async () => current
}

const NOBODY: MeetingMinuteReader = async () => null

let db: TestDb
let storagePath: string

async function minute(
  number: number,
  startedAt: string,
  options: { approved?: boolean; opening?: string } = {}
): Promise<number> {
  const started_at = parseChurchDateTime(startedAt)
  const created = await createMeetingMinute(
    {
      number,
      title: 'Reunião ordinária',
      started_at,
      ended_at: new Date(started_at.getTime() + 30 * 60 * 1000),
      location: 'Salão social',
      attendees: '- Pastor João',
      opening: options.opening ?? 'A reunião foi aberta com oração.',
      closing: 'Nada mais havendo a tratar.',
      topics: [{ title: 'Orçamento', discussion: 'O orçamento anual foi aprovado.' }],
    },
    db
  )
  if (options.approved !== false) await approveMeetingMinute(created.id, db)

  return created.id
}

function bookPages(pdf: Buffer): string[] {
  return pdfPageTexts(pdf).map((page) => page.replace(/\s+/g, ' '))
}

function pageOf(pages: string[], fragment: string): number {
  return pages.findIndex((page) => page.includes(fragment))
}

beforeEach(async () => {
  db = await createTestDb()
  storagePath = await mkdtemp(path.join(tmpdir(), 'meeting-minute-book-'))
  process.env.MEDIA_STORAGE_PATH = storagePath
})

afterEach(async () => {
  delete process.env.MEDIA_STORAGE_PATH
  await rm(storagePath, { recursive: true, force: true })
})

afterAll(async () => {
  await closeSharedBrowser()
})

const PERIOD = { from: YEAR.from, to: YEAR.to, order: YEAR.order }

describe('meetingMinuteBookSummary', () => {
  it('refuses a request without an active session', async () => {
    expect(await meetingMinuteBookSummary(null, PERIOD, db)).toEqual({ status: 'forbidden' })
  })

  it('refuses a Usuário without read on Atas', async () => {
    const refused = user('none')

    expect(await meetingMinuteBookSummary(refused, PERIOD, db)).toEqual({ status: 'forbidden' })
    expect(refused.can).toHaveBeenCalledWith('meeting_minutes', 'read')
  })

  it('reports the period, the order and the Números it would bind', async () => {
    await minute(4, '2026-06-07T19:30')
    await minute(9, '2026-06-08T19:30')
    await minute(12, '2026-07-01T19:30', { approved: false })

    expect(await meetingMinuteBookSummary(user('read'), PERIOD, db)).toEqual({
      status: 'ok',
      summary: { ...PERIOD, count: 2, firstNumber: 4, lastNumber: 9 },
    })
  })

  it('reports a period that holds nothing', async () => {
    await minute(1, '2026-06-07T19:30')

    expect(
      await meetingMinuteBookSummary(user('read'), { ...PERIOD, from: '2025-01-01', to: '2025-12-31' }, db)
    ).toEqual({
      status: 'ok',
      summary: {
        from: '2025-01-01',
        to: '2025-12-31',
        order: 'chronological',
        count: 0,
        firstNumber: null,
        lastNumber: null,
      },
    })
  })

  it('refuses a period that is not a period', async () => {
    expect(await meetingMinuteBookSummary(user('read'), { ...PERIOD, to: '2025-12-31' }, db)).toEqual({
      status: 'invalid',
    })
    expect(await meetingMinuteBookSummary(user('read'), { ...PERIOD, from: '07/06/2026' }, db)).toEqual({
      status: 'invalid',
    })
    expect(await meetingMinuteBookSummary(user('read'), { ...PERIOD, order: 'alphabetical' }, db)).toEqual({
      status: 'invalid',
    })
  })
})

describe('generateMeetingMinuteBook', () => {
  it('refuses a request without read on Atas', async () => {
    expect(await generateMeetingMinuteBook(NOBODY, YEAR, db)).toEqual({ status: 'forbidden' })
    expect(await generateMeetingMinuteBook(reader('none'), YEAR, db)).toEqual({ status: 'forbidden' })
  })

  it('refuses to bind a period with no Ata Aprovada', async () => {
    await minute(1, '2026-06-07T19:30', { approved: false })

    expect(await generateMeetingMinuteBook(reader('read'), YEAR, db)).toEqual({ status: 'empty' })
  })

  it('binds the capa and the Atas Aprovadas in chronological order', { timeout: 180_000 }, async () => {
    await minute(9, '2026-06-08T19:30')
    await minute(7, '2026-06-07T19:30')

    const result = await generateMeetingMinuteBook(reader('read'), YEAR, db)

    expect(result).toMatchObject({ status: 'ok', filename: 'livro-de-atas-7-9.pdf' })
    const pages = bookPages(result.status === 'ok' ? result.pdf : Buffer.alloc(0))
    expect(pages).toHaveLength(3)
    expect(pageOf(pages, 'Livro de Atas da Mesa Administrativa')).toBe(0)
    expect(pageOf(pages, '7ª Ata')).toBe(1)
    expect(pageOf(pages, '9ª Ata')).toBe(2)
  })

  it('binds the Atas the other way round when the order is reversed', { timeout: 180_000 }, async () => {
    await minute(9, '2026-06-08T19:30')
    await minute(7, '2026-06-07T19:30')

    const result = await generateMeetingMinuteBook(reader('read'), { ...YEAR, order: 'reverse' }, db)

    expect(result).toMatchObject({ status: 'ok', filename: 'livro-de-atas-7-9.pdf' })
    const pages = bookPages(result.status === 'ok' ? result.pdf : Buffer.alloc(0))
    expect(pageOf(pages, '9ª Ata')).toBe(1)
    expect(pageOf(pages, '7ª Ata')).toBe(2)
  })

  it('leaves out an Ata whose Data is outside the period', { timeout: 180_000 }, async () => {
    await minute(7, '2026-06-07T19:30')
    await minute(9, '2026-07-01T19:30')

    const result = await generateMeetingMinuteBook(reader('read'), { ...YEAR, to: '2026-06-30' }, db)

    expect(result).toMatchObject({ status: 'ok', filename: 'livro-de-atas-7-7.pdf' })
    const pages = bookPages(result.status === 'ok' ? result.pdf : Buffer.alloc(0))
    expect(pages).toHaveLength(2)
    expect(pageOf(pages, '9ª Ata')).toBe(-1)
  })

  it('fills a missing cache on the way out', { timeout: 180_000 }, async () => {
    const id = await minute(7, '2026-06-07T19:30')

    await generateMeetingMinuteBook(reader('read'), YEAR, db)

    const stored = (await getMeetingMinuteById(id, db))?.pdf_path
    expect(stored).toMatch(/^[a-f0-9]{48}\.pdf$/)
  })

  it('binds the cache an Ata already has instead of a new document', { timeout: 180_000 }, async () => {
    const id = await minute(7, '2026-06-07T19:30')
    await ensureMeetingMinutePdfCache(id, db)
    const stored = (await getMeetingMinuteById(id, db))!.pdf_path!
    const marker = await renderPdf('marker', async () => '<!doctype html><html><body>CACHE ANTERIOR</body></html>')
    await writeMeetingMinutePdfCache(stored, marker)

    const result = await generateMeetingMinuteBook(reader('read'), YEAR, db)

    const pages = bookPages(result.status === 'ok' ? result.pdf : Buffer.alloc(0))
    expect(pageOf(pages, 'CACHE ANTERIOR')).toBe(1)
    expect(await readFile(path.join(storagePath, 'meeting-minute-pdfs', stored))).toEqual(marker)
  })

  it('refuses a request that does not name the operation it belongs to', async () => {
    expect(await generateMeetingMinuteBook(reader('read'), { ...YEAR, token: 'livro' }, db)).toEqual({
      status: 'invalid',
    })
  })

  it('aborts the whole Livro when a single Ata cannot be produced', { timeout: 180_000 }, async () => {
    await minute(7, '2026-06-07T19:30')
    await minute(9, '2026-06-08T19:30', { opening: 'Aberta com ![diagrama](https://localhost/diagrama.png) em anexo.' })

    expect(await generateMeetingMinuteBook(reader('read'), YEAR, db)).toEqual({
      status: 'failed',
      message: MEETING_MINUTE_BOOK_FAILURE,
    })
  })
})

describe('the queue a Livro passes through', () => {
  const OTHER_TOKEN = '11112222-3333-4444-5555-666677778888'

  function state(token: string): PdfJobState | null {
    return meetingMinuteBookState(user('read'), token)
  }

  it('reports the state of one export and not of exports in general', async () => {
    await minute(7, '2026-06-07T19:30')

    expect(state(TOKEN)).toBe('idle')
    const exporting = generateMeetingMinuteBook(reader('read'), YEAR, db)

    // The operation reaches the queue only after it knows who is asking and what it will bind.
    await vi.waitFor(() => expect(state(TOKEN)).not.toBe('idle'))
    expect(state(OTHER_TOKEN)).toBe('idle')
    await exporting
    expect(state(TOKEN)).toBe('idle')
  })

  it('keeps a second Livro waiting until the first one has its bytes', { timeout: 300_000 }, async () => {
    await minute(7, '2026-06-07T19:30')
    await minute(9, '2026-06-08T19:30')

    const seen: (PdfJobState | null)[][] = []
    const sampling = setInterval(() => seen.push([state(TOKEN), state(OTHER_TOKEN)]), 20)
    const [first, second] = await Promise.all([
      generateMeetingMinuteBook(reader('read'), YEAR, db),
      generateMeetingMinuteBook(reader('read'), { ...YEAR, token: OTHER_TOKEN }, db),
    ])
    clearInterval(sampling)

    expect([first.status, second.status]).toEqual(['ok', 'ok'])
    // The merge holds as much as the render does, so no two Livros may be under way at once.
    expect(seen.every(([one, other]) => !(one === 'generating' && other === 'generating'))).toBe(true)
    expect(seen.some(([one, other]) => one === 'generating' && other === 'waiting')).toBe(true)
  })
})

describe('a Permissão revoked while the Livro is being bound', () => {
  // The reader answers for one request at a time, so the revocation is expressed as the answer
  // it gives from a given step on.
  function revokedAfter(answers: number): MeetingMinuteReader {
    let asked = 0

    return async () => (++asked <= answers ? user('read') : user('none'))
  }

  it('hands over nothing when the Permissão goes away between two Atas', { timeout: 180_000 }, async () => {
    await minute(7, '2026-06-07T19:30')
    await minute(9, '2026-06-08T19:30')

    expect(await generateMeetingMinuteBook(revokedAfter(2), YEAR, db)).toEqual({ status: 'forbidden' })
  })

  it('hands over nothing when the Permissão goes away just before the bytes leave', { timeout: 180_000 }, async () => {
    await minute(7, '2026-06-07T19:30')
    await minute(9, '2026-06-08T19:30')

    expect(await generateMeetingMinuteBook(revokedAfter(3), YEAR, db)).toEqual({ status: 'forbidden' })
  })
})
