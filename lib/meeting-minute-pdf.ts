import { db as defaultDb, type Database } from '@/db'
import {
  claimMeetingMinutePdfPath,
  getMeetingMinuteById,
  MeetingMinuteNotFoundError,
  type MeetingMinuteWithTopics,
} from '@/db/queries/meeting-minutes'
import type { CurrentUser } from '@/lib/auth/current-user'
import { meetingMinutePdfFilename, renderMeetingMinuteDocumentHtml } from '@/lib/meeting-minute-document'
import {
  meetingMinutePdfCacheExists,
  newMeetingMinutePdfCacheName,
  readMeetingMinutePdfCache,
  writeMeetingMinutePdfCache,
} from '@/lib/meeting-minute-pdf-cache'
import { pdfJobState, renderPdf, type PdfJobState } from '@/lib/pdf/browser'
import { RemoteImageError } from '@/lib/pdf/remote-image'

export type MeetingMinutePdfResult =
  | { status: 'ok'; pdf: Buffer; filename: string }
  | { status: 'forbidden' }
  | { status: 'not-found' }
  | { status: 'failed'; message: string }

export const MEETING_MINUTE_PDF_FAILURE = 'Não foi possível gerar o PDF da Ata. Tente novamente.'

export function meetingMinutePdfJob(id: number): string {
  return `meeting-minute:${id}`
}

export function meetingMinutePdfState(user: CurrentUser | null, id: number): PdfJobState | null {
  return user?.can('meeting_minutes', 'read') ? pdfJobState(meetingMinutePdfJob(id)) : null
}

// Authorization is re-decided on every request: the URL of a PDF is not a capability, and
// a Usuário who lost the Permissão between two clicks must be refused on the second.
export async function generateMeetingMinutePdf(
  user: CurrentUser | null,
  id: number,
  db: Database = defaultDb
): Promise<MeetingMinutePdfResult> {
  if (!user?.can('meeting_minutes', 'read')) return { status: 'forbidden' }
  if (!Number.isInteger(id) || id < 1) return { status: 'not-found' }

  const minute = await getMeetingMinuteById(id, db)
  if (!minute) return { status: 'not-found' }

  const filename = meetingMinutePdfFilename(minute)

  try {
    if (minute.status === 'pending') {
      return { status: 'ok', pdf: await renderMeetingMinutePdf(minute), filename }
    }

    return { status: 'ok', pdf: await storedMeetingMinutePdf(minute, db), filename }
  } catch (error) {
    return { status: 'failed', message: meetingMinutePdfFailureMessage(error) }
  }
}

export function meetingMinutePdfFailureMessage(error: unknown): string {
  return error instanceof RemoteImageError ? error.message : MEETING_MINUTE_PDF_FAILURE
}

// Approving must not depend on the document: the cache is filled only when it is missing,
// so repeating the Aprovação of a consolidated Ata adds nothing to what is already stored.
export async function ensureMeetingMinutePdfCache(id: number, db: Database = defaultDb): Promise<void> {
  const minute = await loadMeetingMinute(id, db)
  if (await meetingMinutePdfCacheExists(minute.pdf_path)) return

  await storeMeetingMinutePdf(minute, db)
}

export async function regenerateMeetingMinutePdfCache(id: number, db: Database = defaultDb): Promise<void> {
  await storeMeetingMinutePdf(await loadMeetingMinute(id, db), db)
}

// A missing file is a missing cache, nothing more: the Ata itself is intact in the database,
// so the document is rebuilt and stored on the way out.
export async function storedMeetingMinutePdf(
  minute: { id: number; pdf_path: string | null },
  db: Database
): Promise<Buffer> {
  const cached = await readMeetingMinutePdfCache(minute.pdf_path)
  if (cached) return cached

  return storeMeetingMinutePdf(await loadMeetingMinute(minute.id, db), db)
}

async function loadMeetingMinute(id: number, db: Database): Promise<MeetingMinuteWithTopics> {
  const minute = await getMeetingMinuteById(id, db)
  if (!minute) throw new MeetingMinuteNotFoundError(id)

  return minute
}

async function storeMeetingMinutePdf(minute: MeetingMinuteWithTopics, db: Database): Promise<Buffer> {
  const name = await claimMeetingMinutePdfPath(minute.id, newMeetingMinutePdfCacheName(), db)
  const pdf = await renderMeetingMinutePdf(minute)
  await writeMeetingMinutePdfCache(name, pdf)

  return pdf
}

// Inside a Livro this render is already holding the queue, and the job it names is the Livro's;
// on its own the Ata is its own job, which is what the operator's control watches.
function renderMeetingMinutePdf(minute: MeetingMinuteWithTopics): Promise<Buffer> {
  return renderPdf(meetingMinutePdfJob(minute.id), () => renderMeetingMinuteDocumentHtml(minute))
}
