import { NextResponse } from 'next/server'
import { ARTICLE_FALLBACK_IMAGE, streamFeaturedImage } from '@/lib/featured-image'

export async function GET(_request: Request, context: { params: Promise<{ path: string }> }) {
  const { path } = await context.params
  const stream = await streamFeaturedImage(path)
  if (!stream) return NextResponse.redirect(new URL(ARTICLE_FALLBACK_IMAGE, _request.url), 302)

  return new Response(stream, {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
