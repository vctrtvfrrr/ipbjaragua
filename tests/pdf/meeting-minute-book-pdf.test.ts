import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { approveMeetingMinute, createMeetingMinute } from '@/db/queries/meeting-minutes'
import type { CurrentUser } from '@/lib/auth/current-user'
import { CHURCH_NAME } from '@/lib/church'
import { parseChurchDateTime } from '@/lib/date'
import { MEETING_MINUTE_BOOK_TITLE } from '@/lib/meeting-minute-book'
import { generateMeetingMinuteBook } from '@/lib/meeting-minute-book-pdf'
import { closeSharedBrowser } from '@/lib/pdf/browser'
import { createTestDb, type TestDb } from '@/tests/db'
import { nodeHeldBytes, sampleMemory } from './memory'
import { pdfPageSizes, pdfPageTexts } from './pdf-text'

const A4 = { width: 595, height: 842 }
const SERVICE_MEMORY_LIMIT_BYTES = 512 * 1024 * 1024
// What the Node server itself is expected to hold while a Livro is bound; the rest of the
// service's 512 MB is the budget the export may claim for Chromium and for the merge.
const NODE_SERVER_ALLOWANCE_BYTES = 128 * 1024 * 1024

const READER: CurrentUser = {
  id: 1,
  email: 'ana@example.com',
  name: 'Ana',
  can: vi.fn((_entity, action) => action === 'read'),
}

let db: TestDb
let storagePath: string

async function approvedMinute(number: number, day: number, topics = 1): Promise<void> {
  const started_at = parseChurchDateTime(`2026-06-${String(day).padStart(2, '0')}T19:30`)
  const created = await createMeetingMinute(
    {
      number,
      title: 'Reunião ordinária',
      started_at,
      ended_at: new Date(started_at.getTime() + 90 * 60 * 1000),
      location: 'Salão social',
      attendees: '- Pastor João\n- Presbítero Pedro',
      opening: 'A reunião foi aberta com oração.',
      closing: 'Nada mais havendo a tratar, a reunião foi encerrada.',
      topics: Array.from({ length: topics }, (_, index) => ({
        title: `Tópico ${index + 1}`,
        discussion: 'Deliberação registrada na íntegra. '.repeat(60),
      })),
    },
    db
  )
  await approveMeetingMinute(created.id, db)
}

async function exportBook(input: { from: string; to: string; order?: 'chronological' | 'reverse' }): Promise<Buffer> {
  const result = await generateMeetingMinuteBook(READER, { order: 'chronological', ...input }, db)
  if (result.status !== 'ok') throw new Error(`the Livro was not produced: ${result.status}`)

  return result.pdf
}

function readablePages(pdf: Buffer): string[] {
  return pdfPageTexts(pdf).map((page) => page.replace(/\s+/g, ' '))
}

beforeEach(async () => {
  db = await createTestDb()
  storagePath = await mkdtemp(path.join(tmpdir(), 'meeting-minute-book-pdf-'))
  process.env.MEDIA_STORAGE_PATH = storagePath
})

afterEach(async () => {
  delete process.env.MEDIA_STORAGE_PATH
  await rm(storagePath, { recursive: true, force: true })
})

afterAll(async () => {
  await closeSharedBrowser()
})

describe('the PDF of a Livro de Atas', () => {
  it('opens with a capa that says only what identifies the Livro', { timeout: 180_000 }, async () => {
    await approvedMinute(7, 7)
    await approvedMinute(9, 8)

    const [cover] = readablePages(await exportBook({ from: '2026-01-01', to: '2026-12-31' }))

    expect(cover).toContain(MEETING_MINUTE_BOOK_TITLE)
    expect(cover).toContain(CHURCH_NAME)
    expect(cover).toContain('01 de janeiro de 2026 a 31 de dezembro de 2026')
    expect(cover).toContain('Atas 7 a 9')
    expect(cover.replace(MEETING_MINUTE_BOOK_TITLE, '').replace(CHURCH_NAME, '')).not.toContain('Ata de Reunião')
  })

  it('names the interval by the Números it holds, gaps and all', { timeout: 180_000 }, async () => {
    await approvedMinute(4, 7)
    await approvedMinute(12, 8)

    const [cover] = readablePages(await exportBook({ from: '2026-01-01', to: '2026-12-31', order: 'reverse' }))

    expect(cover).toContain('Atas 4 a 12')
  })

  it('is an A4 document from the capa to the last Ata', { timeout: 180_000 }, async () => {
    await approvedMinute(7, 7, 4)

    const sizes = pdfPageSizes(await exportBook({ from: '2026-01-01', to: '2026-12-31' }))

    expect(sizes.length).toBeGreaterThan(2)
    for (const size of sizes) {
      expect(size.width).toBeCloseTo(A4.width, -1)
      expect(size.height).toBeCloseTo(A4.height, -1)
    }
  })

  it('carries neither an index nor a page number', { timeout: 180_000 }, async () => {
    await approvedMinute(7, 7, 4)
    await approvedMinute(9, 8, 4)

    const pages = readablePages(await exportBook({ from: '2026-01-01', to: '2026-12-31' }))

    expect(pages.length).toBeGreaterThan(4)
    expect(pages[0]).not.toContain('Índice')
    for (const [index, page] of pages.entries()) {
      expect(page).not.toContain(`Página ${index + 1}`)
      expect(page.trimEnd().endsWith(String(index + 1))).toBe(false)
    }
  })

  it('binds a representative Livro inside the memory the service is given', { timeout: 300_000 }, async () => {
    for (let number = 1; number <= 12; number++) await approvedMinute(number, 1 + (number % 28), 6)

    const sampling = sampleMemory(nodeHeldBytes)
    const pdf = await exportBook({ from: '2026-01-01', to: '2026-12-31' })
    const peak = await sampling.stop()

    expect(pdfPageTexts(pdf).length).toBeGreaterThan(12)
    // The observed peak is what this test exists to record.
    console.log(`peak Livro memory: ${(peak / 1024 / 1024).toFixed(1)} MB`)
    expect(peak).toBeLessThan(SERVICE_MEMORY_LIMIT_BYTES - NODE_SERVER_ALLOWANCE_BYTES)
  })
})
