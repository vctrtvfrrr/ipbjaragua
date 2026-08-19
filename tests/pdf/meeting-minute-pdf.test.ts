import { readdir, readFile } from 'node:fs/promises'
import { afterAll, describe, expect, it } from 'vitest'
import {
  PENDING_WATERMARK,
  renderMeetingMinuteDocumentHtml,
  type MeetingMinuteDocument,
} from '@/lib/meeting-minute-document'
import { closeSharedBrowser, pdfJobState, renderPdf } from '@/lib/pdf/browser'
import { pdfPageSizes, pdfPageTexts } from './pdf-text'

const A4 = { width: 595, height: 842 }
const SERVICE_MEMORY_LIMIT_BYTES = 512 * 1024 * 1024
// What the Node server itself is expected to hold while Chromium runs; the rest of the
// service's 512 MB is the budget a single generation may claim.
const NODE_SERVER_ALLOWANCE_BYTES = 192 * 1024 * 1024

const MINUTE: MeetingMinuteDocument = {
  number: 12,
  title: 'IPB de Jaraguá do Sul',
  started_at: new Date('2026-06-07T22:30:00Z'),
  ended_at: new Date('2026-06-08T00:00:00Z'),
  location: 'Salão social',
  attendees: '- Pastor João\n- Presbítero Pedro',
  opening: 'A reunião foi aberta com oração.',
  closing: 'Nada mais havendo a tratar, a reunião foi encerrada.',
  topics: [
    { title: 'Orçamento', discussion: 'O orçamento anual foi **aprovado** por unanimidade.' },
    { title: 'Reforma', discussion: '| Etapa | Prazo |\n| --- | --- |\n| Telhado | Março |' },
  ],
}

function longMinute(topics: number, words: number): MeetingMinuteDocument {
  return {
    ...MINUTE,
    topics: Array.from({ length: topics }, (_, index) => ({
      title: `Tópico ${index + 1}`,
      discussion: 'Deliberação registrada na íntegra. '.repeat(words),
    })),
  }
}

async function pendingPdf(minute: MeetingMinuteDocument, job = 'test'): Promise<Buffer> {
  return renderPdf(job, await renderMeetingMinuteDocumentHtml(minute, { watermark: PENDING_WATERMARK }))
}

afterAll(async () => {
  await closeSharedBrowser()
})

describe('the PDF of a Pending Ata', () => {
  it('is an A4 document', { timeout: 60_000 }, async () => {
    const sizes = pdfPageSizes(await pendingPdf(MINUTE))

    expect(sizes.length).toBeGreaterThan(0)
    for (const size of sizes) {
      expect(size.width).toBeCloseTo(A4.width, -1)
      expect(size.height).toBeCloseTo(A4.height, -1)
    }
  })

  it('follows the order of the documental model', { timeout: 60_000 }, async () => {
    const [page] = pdfPageTexts(await pendingPdf(MINUTE))

    const order = [
      'IPB de Jaraguá do Sul',
      '12ª ATA DE REUNIÃO',
      'DATA',
      '07/06/2026',
      'HORÁRIO',
      '19:30 às 21:00',
      'LOCAL',
      'Salão social',
      'Participantes',
      'Abertura',
      'Tópicos Discutidos',
      'Orçamento',
      'Reforma',
      'Encerramento',
    ]

    const positions = order.map((fragment) => page.indexOf(fragment))
    expect(positions.every((position) => position >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
  })

  it('puts the Markdown of every field on paper', { timeout: 60_000 }, async () => {
    const [page] = pdfPageTexts(await pendingPdf(MINUTE))

    expect(page).toContain('Pastor João')
    expect(page).toContain('A reunião foi aberta com oração.')
    expect(page).toContain('aprovado')
    expect(page).toContain('Telhado')
    expect(page).toContain('Nada mais havendo a tratar')
  })

  it('marks every page with the watermark', { timeout: 90_000 }, async () => {
    const pages = pdfPageTexts(await pendingPdf(longMinute(8, 80)))

    expect(pages.length).toBeGreaterThan(1)
    for (const page of pages) expect(page).toContain(PENDING_WATERMARK)
  })

  it('never renders two documents at the same time', { timeout: 90_000 }, async () => {
    const html = await renderMeetingMinuteDocumentHtml(MINUTE, { watermark: PENDING_WATERMARK })

    const first = renderPdf('queue-first', html)
    const second = renderPdf('queue-second', html)

    expect(pdfJobState('queue-second')).toBe('waiting')

    await Promise.all([first, second])
    expect(pdfJobState('queue-first')).toBe('idle')
    expect(pdfJobState('queue-second')).toBe('idle')
  })

  it('renders a representative Ata inside the memory the service is given', { timeout: 120_000 }, async () => {
    const sampling = sampleMemory()
    const pdf = await pendingPdf(longMinute(20, 120), 'memory')
    const peak = await sampling.stop()

    expect(pdfPageTexts(pdf).length).toBeGreaterThan(5)
    // The observed peak is what this test exists to record.
    console.log(`peak Chromium memory: ${(peak / 1024 / 1024).toFixed(1)} MB`)
    expect(peak).toBeLessThan(SERVICE_MEMORY_LIMIT_BYTES - NODE_SERVER_ALLOWANCE_BYTES)
  })
})

// Only Chromium is measured: the process running the suite is a test runner, not the
// server, so its own resident size says nothing about what the service will hold.
function sampleMemory(): { stop: () => Promise<number> } {
  let peak = 0
  let running = true

  const loop = (async () => {
    while (running) {
      peak = Math.max(peak, await chromiumResidentBytes())
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  })()

  return {
    stop: async () => {
      running = false
      await loop
      return peak
    },
  }
}

// Chromium is a process tree that shares most of its mappings, so resident set size counts
// the same pages once per process; the proportional set size is what the container pays.
async function chromiumResidentBytes(): Promise<number> {
  let total = 0

  for (const entry of await readdir('/proc')) {
    if (!/^\d+$/.test(entry)) continue

    try {
      const command = await readFile(`/proc/${entry}/comm`, 'utf8')
      if (!/chrome|headless/i.test(command)) continue

      const rollup = await readFile(`/proc/${entry}/smaps_rollup`, 'utf8')
      total += Number(/^Pss:\s+(\d+) kB/m.exec(rollup)?.[1] ?? 0) * 1024
    } catch {
      // A process that exits between the scan and the read simply stops counting.
    }
  }

  return total
}
