import { getCurrentUser } from '@/lib/auth/current-user'
import { meetingMinuteBookState } from '@/lib/meeting-minute-book-pdf'
import { meetingMinuteBookBySlug } from '@/lib/meeting-minute-books'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, context: { params: Promise<{ book: string }> }) {
  const book = meetingMinuteBookBySlug((await context.params).book)
  if (!book) return Response.json({ message: 'Acesso negado.' }, { status: 403 })

  const token = new URL(request.url).searchParams.get('token')
  const state = meetingMinuteBookState(await getCurrentUser(), book, token)

  if (!state) return Response.json({ message: 'Acesso negado.' }, { status: 403 })

  return Response.json({ state }, { headers: { 'Cache-Control': 'no-store, private' } })
}
