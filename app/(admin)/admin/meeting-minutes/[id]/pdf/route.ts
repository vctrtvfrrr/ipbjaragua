import { getCurrentUser } from '@/lib/auth/current-user'
import { generateMeetingMinutePdf } from '@/lib/meeting-minute-pdf'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const result = await generateMeetingMinutePdf(await getCurrentUser(), Number(id))

  if (result.status === 'forbidden') return Response.json({ message: 'Acesso negado.' }, { status: 403 })
  if (result.status === 'not-found') return Response.json({ message: 'Ata não encontrada.' }, { status: 404 })
  if (result.status === 'failed') return Response.json({ message: result.message }, { status: 502 })

  return new Response(new Uint8Array(result.pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${result.filename}"`,
      // A Pending Ata has no stored representation: what is on screen must be what the
      // Ata says now, and no shared cache may keep an administrative document.
      'Cache-Control': 'no-store, private',
    },
  })
}
