import { db as defaultDb, type Database } from '@/db'
import { getMeetingMinuteById } from '@/db/queries/meeting-minutes'
import type { CurrentUser } from '@/lib/auth/current-user'
import { meetingMinutePdfFilename, renderMeetingMinuteDocumentHtml } from '@/lib/meeting-minute-document'
import { pdfJobState, renderPdf, type PdfJobState } from '@/lib/pdf/browser'
import { RemoteImageError } from '@/lib/pdf/remote-image'

export type MeetingMinutePdfResult =
  | { status: 'ok'; pdf: Buffer; filename: string }
  | { status: 'forbidden' }
  | { status: 'not-found' }
  | { status: 'failed'; message: string }

const GENERIC_FAILURE = 'Não foi possível gerar o PDF da Ata. Tente novamente.'

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
  // An Approved Ata is read from its stored PDF, a cache this slice does not build yet;
  // rendering one on demand would hand out a document nothing keeps.
  if (!minute || minute.status !== 'pending') return { status: 'not-found' }

  try {
    const pdf = await renderPdf(meetingMinutePdfJob(id), () => renderMeetingMinuteDocumentHtml(minute))

    return { status: 'ok', pdf, filename: meetingMinutePdfFilename(minute) }
  } catch (error) {
    return { status: 'failed', message: error instanceof RemoteImageError ? error.message : GENERIC_FAILURE }
  }
}
