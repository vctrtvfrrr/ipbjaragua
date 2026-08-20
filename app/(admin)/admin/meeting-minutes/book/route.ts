import { getCurrentUser } from '@/lib/auth/current-user'
import { MEETING_MINUTE_BOOK_EMPTY, MEETING_MINUTE_BOOK_INVALID } from '@/lib/meeting-minute-book'
import { generateMeetingMinuteBook } from '@/lib/meeting-minute-book-pdf'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const result = await generateMeetingMinuteBook(await getCurrentUser(), {
    from: searchParams.get('from') ?? '',
    to: searchParams.get('to') ?? '',
    order: searchParams.get('order') ?? '',
  })

  if (result.status === 'forbidden') return Response.json({ message: 'Acesso negado.' }, { status: 403 })
  if (result.status === 'invalid') return Response.json({ message: MEETING_MINUTE_BOOK_INVALID }, { status: 400 })
  if (result.status === 'empty') return Response.json({ message: MEETING_MINUTE_BOOK_EMPTY }, { status: 422 })
  if (result.status === 'failed') return Response.json({ message: result.message }, { status: 502 })

  return new Response(new Uint8Array(result.pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      // The Livro is transient: it is never stored, and no shared cache may keep an
      // administrative document that only the requesting Usuário was authorized to read.
      'Cache-Control': 'no-store, private',
    },
  })
}
