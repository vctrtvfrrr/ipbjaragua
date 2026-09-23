import { readdir, readFile } from 'node:fs/promises'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { closeSharedBrowser, PDF_BROWSER_IDLE_MS, renderPdf, runPdfJob } from '@/lib/pdf/browser'

const PAGE = async () => '<!doctype html><html><body>Ata</body></html>'

// Playwright launches the browser as a direct child of this process, so its pid is the
// identity of the instance: a new pid is a new Chromium.
async function browserPid(): Promise<number | null> {
  for (const entry of await readdir('/proc')) {
    if (!/^\d+$/.test(entry)) continue

    try {
      const stat = await readFile(`/proc/${entry}/stat`, 'utf8')
      const [, command, rest] = /^\d+ \((.*)\) (.*)/.exec(stat) ?? []
      const parent = Number(rest?.split(' ')[1])
      if (parent === process.pid && /chrome|headless/i.test(command ?? '')) return Number(entry)
    } catch {
      // A process that exits between the scan and the read is not the browser.
    }
  }

  return null
}

async function untilClosed(): Promise<void> {
  await vi.waitFor(async () => expect(await browserPid()).toBeNull(), { timeout: 10_000 })
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
})

afterEach(async () => {
  vi.useRealTimers()
  await closeSharedBrowser()
})

describe('the Chromium behind the PDF queue', () => {
  it('closes once the queue has been idle for the whole window', { timeout: 60_000 }, async () => {
    await renderPdf('idle', PAGE)

    await vi.advanceTimersByTimeAsync(PDF_BROWSER_IDLE_MS - 1)
    expect(await browserPid()).not.toBeNull()

    await vi.advanceTimersByTimeAsync(1)
    await untilClosed()
  })

  it('opens a new browser for a job that arrives after it closed', { timeout: 60_000 }, async () => {
    await renderPdf('before', PAGE)
    const closed = await browserPid()
    await vi.advanceTimersByTimeAsync(PDF_BROWSER_IDLE_MS)
    await untilClosed()

    const pdf = await renderPdf('after', PAGE)

    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
    expect(await browserPid()).not.toBe(closed)
  })

  it('reuses the open browser and restarts the window for a job inside it', { timeout: 60_000 }, async () => {
    await renderPdf('first', PAGE)
    const opened = await browserPid()

    await vi.advanceTimersByTimeAsync(PDF_BROWSER_IDLE_MS / 2)
    await renderPdf('second', PAGE)
    expect(await browserPid()).toBe(opened)

    await vi.advanceTimersByTimeAsync(PDF_BROWSER_IDLE_MS - 1)
    expect(await browserPid()).toBe(opened)

    await vi.advanceTimersByTimeAsync(1)
    await untilClosed()
  })

  it('does not fail a job that arrives while the browser is closing', { timeout: 60_000 }, async () => {
    await renderPdf('closing', PAGE)

    await vi.advanceTimersByTimeAsync(PDF_BROWSER_IDLE_MS)
    const pdf = await renderPdf('meanwhile', PAGE)

    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
  })

  it('keeps the browser for the whole of a job that holds the queue', { timeout: 60_000 }, async () => {
    const pids = await runPdfJob('book', async () => {
      await renderPdf('book', PAGE)
      const first = await browserPid()
      await vi.advanceTimersByTimeAsync(PDF_BROWSER_IDLE_MS * 2)
      await renderPdf('book', PAGE)
      return [first, await browserPid()]
    })

    expect(pids[0]).not.toBeNull()
    expect(pids[1]).toBe(pids[0])
  })
})
