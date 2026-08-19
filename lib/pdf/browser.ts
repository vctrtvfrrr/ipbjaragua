import { chromium, type Browser } from 'playwright'

export type PdfJobState = 'idle' | 'waiting' | 'generating'

let browserPromise: Promise<Browser> | null = null
let tail: Promise<unknown> = Promise.resolve()
const queued = new Map<string, number>()
let running: string | null = null

// One Chromium per instance, one page at a time: the service runs under 512 MB, and a
// second browser — or a second concurrent render — is what puts it over.
async function sharedBrowser(): Promise<Browser> {
  browserPromise ??= chromium
    // The headless shell is the whole browser this service needs, and the only one the
    // production image ships: rendering paper never asks for a window.
    .launch({ channel: 'chromium-headless-shell' })
    .then((browser) => {
      browser.on('disconnected', () => {
        browserPromise = null
      })
      return browser
    })
    .catch((error) => {
      browserPromise = null
      throw error
    })

  return browserPromise
}

export function pdfJobState(job: string): PdfJobState {
  if (running === job) return 'generating'
  return queued.has(job) ? 'waiting' : 'idle'
}

// The document is built inside the queue, not before it: fetching the images is the part
// with unbounded memory and network, so leaving it outside would serialize only the cheap half.
export async function renderPdf(job: string, build: () => Promise<string>): Promise<Buffer> {
  queued.set(job, (queued.get(job) ?? 0) + 1)

  const result = tail.then(async () => {
    release(job)
    running = job
    try {
      return await print(await build())
    } finally {
      running = null
    }
  })

  // The queue only serializes; a failed render must not poison the renders behind it.
  tail = result.catch(() => undefined)
  return result
}

function release(job: string): void {
  const pending = (queued.get(job) ?? 1) - 1
  if (pending > 0) queued.set(job, pending)
  else queued.delete(job)
}

async function print(html: string): Promise<Buffer> {
  const browser = await sharedBrowser()
  const context = await browser.newContext()

  try {
    const page = await context.newPage()
    // Every asset was inlined before the page existed, so a request leaving Chromium is
    // either a leak of the document or a destination the image guard already refused.
    await page.route(
      (url) => url.protocol !== 'data:' && url.protocol !== 'about:',
      (route) => route.abort()
    )
    await page.setContent(html, { waitUntil: 'load' })

    return await page.pdf({ printBackground: true, preferCSSPageSize: true })
  } finally {
    await context.close()
  }
}

export async function closeSharedBrowser(): Promise<void> {
  const browser = browserPromise
  browserPromise = null
  await browser?.then((instance) => instance.close()).catch(() => undefined)
}
