import { NextResponse } from 'next/server'
import { ARTICLE_FALLBACK_IMAGE, readFeaturedImage } from '@/lib/featured-image'

export async function GET(_request: Request, context: { params: Promise<{ path: string }> }) {
  const { path } = await context.params
  const bytes = await readFeaturedImage(path)
  if (!bytes) return NextResponse.redirect(new URL(ARTICLE_FALLBACK_IMAGE, _request.url), 302)

  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
