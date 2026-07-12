import { headers } from 'next/headers'
import { getPublicOriginFromHeaders } from '@/lib/http/request-origin'

// Absolute base for canonical URLs and og:image resolution. Prefers the
// configured SITE_URL (keeps pages statically renderable); otherwise derives
// the origin from the incoming request so it works on any host without config.
export async function resolveMetadataBase(): Promise<URL> {
  const configured = process.env.SITE_URL
  if (configured) return new URL(configured)

  const origin = getPublicOriginFromHeaders(await headers())
  return new URL(origin ?? 'http://localhost:3000')
}
