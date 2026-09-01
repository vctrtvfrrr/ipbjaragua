import { PDFDocument } from 'pdf-lib'
import { db as defaultDb, type Database } from '@/db'
import {
  listApprovedMeetingMinutesForBook,
  summarizeApprovedMeetingMinutes,
  type MeetingMinuteBookEntry,
} from '@/db/queries/meeting-minutes'
import type { CurrentUser } from '@/lib/auth/current-user'
import { churchDayRange } from '@/lib/date'
import {
  meetingMinuteBookFilename,
  meetingMinuteBookJob,
  meetingMinuteBookRequestSchema,
  meetingMinuteBookSchema,
  MEETING_MINUTE_BOOK_FAILURE,
  type MeetingMinuteBookSummary,
} from '@/lib/meeting-minute-book'
import { renderMeetingMinuteBookCoverHtml, type MeetingMinuteBookCover } from '@/lib/meeting-minute-book-document'
import type { MeetingMinuteBookDefinition } from '@/lib/meeting-minute-books'
import { storedMeetingMinutePdf } from '@/lib/meeting-minute-pdf'
import { pdfJobState, renderPdf, runPdfJob, type PdfJobState } from '@/lib/pdf/browser'

// The Livro outlives no request, but a request can outlive a Permissão: the situation is read
// again from the cookie and the database, never from a snapshot taken minutes earlier.
export type MeetingMinuteReader = () => Promise<CurrentUser | null>

export type MeetingMinuteBookSummaryResult =
  { status: 'ok'; summary: MeetingMinuteBookSummary } | { status: 'forbidden' } | { status: 'invalid' }

export type MeetingMinuteBookResult =
  | { status: 'ok'; pdf: Buffer; filename: string }
  | { status: 'forbidden' }
  | { status: 'invalid' }
  | { status: 'empty' }
  | { status: 'failed'; message: string }

export function meetingMinuteBookState(
  user: CurrentUser | null,
  book: MeetingMinuteBookDefinition,
  token: string | null
): PdfJobState | null {
  if (!user?.can('meeting_minutes', 'read', book.slug)) return null

  return token ? pdfJobState(meetingMinuteBookJob(token)) : 'idle'
}

export async function meetingMinuteBookSummary(
  user: CurrentUser | null,
  book: MeetingMinuteBookDefinition,
  input: unknown,
  db: Database = defaultDb
): Promise<MeetingMinuteBookSummaryResult> {
  if (!user?.can('meeting_minutes', 'read', book.slug)) return { status: 'forbidden' }

  const parsed = meetingMinuteBookSchema.safeParse(input)
  if (!parsed.success) return { status: 'invalid' }

  const period = parsed.data
  const selection = await summarizeApprovedMeetingMinutes(book.slug, churchDayRange(period.from, period.to), db)

  return { status: 'ok', summary: { ...period, ...selection } }
}

class RevokedDuringExportError extends Error {}

// The export is transient — nothing it produces outlives the response — and it is long, so
// authorization is re-decided at every Ata and once more before the bytes leave: a Usuário who
// lost the Permissão halfway through receives no document at all.
export async function generateMeetingMinuteBook(
  read: MeetingMinuteReader,
  book: MeetingMinuteBookDefinition,
  input: unknown,
  db: Database = defaultDb
): Promise<MeetingMinuteBookResult> {
  if (!(await mayRead(read, book))) return { status: 'forbidden' }

  const parsed = meetingMinuteBookRequestSchema.safeParse(input)
  if (!parsed.success) return { status: 'invalid' }

  const request = parsed.data
  const entries = await listApprovedMeetingMinutesForBook(
    book.slug,
    churchDayRange(request.from, request.to),
    request.order,
    db
  )
  if (entries.length === 0) return { status: 'empty' }

  const numbers = entries.map((entry) => entry.number)
  const cover: MeetingMinuteBookCover = {
    from: request.from,
    to: request.to,
    firstNumber: Math.min(...numbers),
    lastNumber: Math.max(...numbers),
  }

  try {
    const job = meetingMinuteBookJob(request.token)
    const pdf = await runPdfJob(job, () => bindMeetingMinuteBook(entries, book, cover, job, read, db))

    return { status: 'ok', pdf, filename: meetingMinuteBookFilename(book, cover) }
  } catch (error) {
    if (error instanceof RevokedDuringExportError) return { status: 'forbidden' }

    return { status: 'failed', message: MEETING_MINUTE_BOOK_FAILURE }
  }
}

// The Atas are bound one at a time and each source document is dropped as soon as its pages
// are copied: the Livro has no functional limit, and holding every Ata at once is what would
// invent one. A single failure throws, and an aborted Livro is never handed over in part.
async function bindMeetingMinuteBook(
  entries: MeetingMinuteBookEntry[],
  book: MeetingMinuteBookDefinition,
  cover: MeetingMinuteBookCover,
  job: string,
  read: MeetingMinuteReader,
  db: Database
): Promise<Buffer> {
  const document = await PDFDocument.create()

  await appendPdf(document, await renderPdf(job, () => renderMeetingMinuteBookCoverHtml(book, cover)))

  for (const entry of entries) {
    if (!(await mayRead(read, book))) throw new RevokedDuringExportError()

    await appendPdf(document, await storedMeetingMinutePdf(entry, book, db))
  }

  if (!(await mayRead(read, book))) throw new RevokedDuringExportError()

  return Buffer.from(await document.save())
}

async function mayRead(read: MeetingMinuteReader, book: MeetingMinuteBookDefinition): Promise<boolean> {
  return (await read())?.can('meeting_minutes', 'read', book.slug) ?? false
}

async function appendPdf(target: PDFDocument, pdf: Buffer): Promise<void> {
  const source = await PDFDocument.load(pdf)

  for (const page of await target.copyPages(source, source.getPageIndices())) {
    target.addPage(page)
  }
}
