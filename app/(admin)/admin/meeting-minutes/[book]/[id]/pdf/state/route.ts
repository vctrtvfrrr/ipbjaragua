import { getCurrentUser } from '@/lib/auth/current-user'
import { meetingMinutePdfState } from '@/lib/meeting-minute-pdf'
import { meetingMinuteBookBySlug } from '@/lib/meeting-minute-books'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, context: { params: Promise<{ book: string; id: string }> }) {
  const { book: bookSlug, id } = await context.params
  const book = meetingMinuteBookBySlug(bookSlug)
  if (!book) return Response.json({ message: 'Acesso negado.' }, { status: 403 })

  const state = meetingMinutePdfState(await getCurrentUser(), book, Number(id))
  if (!state) return Response.json({ message: 'Acesso negado.' }, { status: 403 })

  return Response.json({ state }, { headers: { 'Cache-Control': 'no-store, private' } })
}
