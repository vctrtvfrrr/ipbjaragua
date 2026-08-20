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
  meetingMinuteBookSchema,
  MEETING_MINUTE_BOOK_FAILURE,
  type MeetingMinuteBookSummary,
} from '@/lib/meeting-minute-book'
import { renderMeetingMinuteBookCoverHtml, type MeetingMinuteBookCover } from '@/lib/meeting-minute-book-document'
import { storedMeetingMinutePdf } from '@/lib/meeting-minute-pdf'
import { pdfJobState, renderPdf, type PdfJobState } from '@/lib/pdf/browser'

export type MeetingMinuteBookSummaryResult =
  { status: 'ok'; summary: MeetingMinuteBookSummary } | { status: 'forbidden' } | { status: 'invalid' }

export type MeetingMinuteBookResult =
  | { status: 'ok'; pdf: Buffer; filename: string }
  | { status: 'forbidden' }
  | { status: 'invalid' }
  | { status: 'empty' }
  | { status: 'failed'; message: string }

export const MEETING_MINUTE_BOOK_JOB = 'meeting-minute-book'

export function meetingMinuteBookState(user: CurrentUser | null): PdfJobState | null {
  return user?.can('meeting_minutes', 'read') ? pdfJobState(MEETING_MINUTE_BOOK_JOB) : null
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

// Authorization is re-decided on every request, and the whole Livro is built inside it: the
// export is transient, so nothing it produces outlives the response that carries it.
export async function generateMeetingMinuteBook(
  user: CurrentUser | null,
  input: unknown,
  db: Database = defaultDb
): Promise<MeetingMinuteBookResult> {
  if (!user?.can('meeting_minutes', 'read')) return { status: 'forbidden' }

  const parsed = meetingMinuteBookSchema.safeParse(input)
  if (!parsed.success) return { status: 'invalid' }

  const period = parsed.data
  const entries = await listApprovedMeetingMinutesForBook(churchDayRange(period.from, period.to), period.order, db)
  if (entries.length === 0) return { status: 'empty' }

  const numbers = entries.map((entry) => entry.number)
  const cover: MeetingMinuteBookCover = {
    from: period.from,
    to: period.to,
    firstNumber: Math.min(...numbers),
    lastNumber: Math.max(...numbers),
  }

  try {
    const pdf = await bindMeetingMinuteBook(entries, cover, db)

    return { status: 'ok', pdf, filename: meetingMinuteBookFilename(cover) }
  } catch {
    return { status: 'failed', message: MEETING_MINUTE_BOOK_FAILURE }
  }
}

// The Atas are bound one at a time and each source document is dropped as soon as its pages
// are copied: the Livro has no functional limit, and holding every Ata at once is what would
// invent one. A single failure throws, and an aborted Livro is never handed over in part.
async function bindMeetingMinuteBook(
  entries: MeetingMinuteBookEntry[],
  cover: MeetingMinuteBookCover,
  db: Database
): Promise<Buffer> {
  const book = await PDFDocument.create()

  await appendPdf(book, await renderPdf(MEETING_MINUTE_BOOK_JOB, () => renderMeetingMinuteBookCoverHtml(cover)))

  for (const entry of entries) {
    await appendPdf(book, await storedMeetingMinutePdf(entry, db, MEETING_MINUTE_BOOK_JOB))
  }

  return Buffer.from(await book.save())
}

async function appendPdf(book: PDFDocument, pdf: Buffer): Promise<void> {
  const document = await PDFDocument.load(pdf)

  for (const page of await book.copyPages(document, document.getPageIndices())) {
    book.addPage(page)
  }
}
