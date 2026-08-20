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

export function meetingMinuteBookState(user: CurrentUser | null, token: string | null): PdfJobState | null {
  if (!user?.can('meeting_minutes', 'read')) return null

  return token ? pdfJobState(meetingMinuteBookJob(token)) : 'idle'
}

export async function meetingMinuteBookSummary(
  user: CurrentUser | null,
  input: unknown,
  db: Database = defaultDb
): Promise<MeetingMinuteBookSummaryResult> {
  if (!user?.can('meeting_minutes', 'read')) return { status: 'forbidden' }

  const parsed = meetingMinuteBookSchema.safeParse(input)
  if (!parsed.success) return { status: 'invalid' }

  const period = parsed.data
  const selection = await summarizeApprovedMeetingMinutes(churchDayRange(period.from, period.to), db)

  return { status: 'ok', summary: { ...period, ...selection } }
}

class RevokedDuringExportError extends Error {}

// The export is transient — nothing it produces outlives the response — and it is long, so
// authorization is re-decided at every Ata and once more before the bytes leave: a Usuário who
// lost the Permissão halfway through receives no document at all.
export async function generateMeetingMinuteBook(
  read: MeetingMinuteReader,
  input: unknown,
  db: Database = defaultDb
): Promise<MeetingMinuteBookResult> {
  if (!(await mayRead(read))) return { status: 'forbidden' }

  const parsed = meetingMinuteBookRequestSchema.safeParse(input)
  if (!parsed.success) return { status: 'invalid' }

  const request = parsed.data
  const entries = await listApprovedMeetingMinutesForBook(churchDayRange(request.from, request.to), request.order, db)
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
    const pdf = await runPdfJob(job, () => bindMeetingMinuteBook(entries, cover, job, read, db))

    return { status: 'ok', pdf, filename: meetingMinuteBookFilename(cover) }
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
  cover: MeetingMinuteBookCover,
  job: string,
  read: MeetingMinuteReader,
  db: Database
): Promise<Buffer> {
  const book = await PDFDocument.create()

  await appendPdf(book, await renderPdf(job, () => renderMeetingMinuteBookCoverHtml(cover)))

  for (const entry of entries) {
    if (!(await mayRead(read))) throw new RevokedDuringExportError()

    await appendPdf(book, await storedMeetingMinutePdf(entry, db))
  }

  if (!(await mayRead(read))) throw new RevokedDuringExportError()

  return Buffer.from(await book.save())
}

async function mayRead(read: MeetingMinuteReader): Promise<boolean> {
  return (await read())?.can('meeting_minutes', 'read') ?? false
}

async function appendPdf(book: PDFDocument, pdf: Buffer): Promise<void> {
  const document = await PDFDocument.load(pdf)

  for (const page of await book.copyPages(document, document.getPageIndices())) {
    book.addPage(page)
  }
}
