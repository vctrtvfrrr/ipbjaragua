import { getCurrentUser } from '@/lib/auth/current-user'
import { meetingMinuteBookState } from '@/lib/meeting-minute-book-pdf'

export const dynamic = 'force-dynamic'

export async function GET() {
  const state = meetingMinuteBookState(await getCurrentUser())

  if (!state) return Response.json({ message: 'Acesso negado.' }, { status: 403 })

  return Response.json({ state }, { headers: { 'Cache-Control': 'no-store, private' } })
}
