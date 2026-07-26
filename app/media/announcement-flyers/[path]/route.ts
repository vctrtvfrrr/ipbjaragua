import { streamAnnouncementFlyer } from '@/lib/announcement-flyer'

export async function GET(_request: Request, context: { params: Promise<{ path: string }> }) {
  const { path } = await context.params
  const stream = await streamAnnouncementFlyer(path)
  if (!stream) return new Response(null, { status: 404 })

  return new Response(stream, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Disposition': `inline; filename="${path}"`,
    },
  })
}
