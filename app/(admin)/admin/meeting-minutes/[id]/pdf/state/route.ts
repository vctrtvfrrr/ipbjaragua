import { getCurrentUser } from '@/lib/auth/current-user'
import { meetingMinutePdfState } from '@/lib/meeting-minute-pdf'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const state = meetingMinutePdfState(await getCurrentUser(), Number(id))

  if (!state) return Response.json({ message: 'Acesso negado.' }, { status: 403 })

  return Response.json({ state }, { headers: { 'Cache-Control': 'no-store, private' } })
}
