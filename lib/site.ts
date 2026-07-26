import { headers } from 'next/headers'
import { getPublicOriginFromHeaders } from '@/lib/http/request-origin'

export async function resolveMetadataBase(): Promise<URL> {
  const configured = process.env.SITE_URL
  if (configured) return new URL(configured)

  const origin = getPublicOriginFromHeaders(await headers())
  return new URL(origin ?? 'http://localhost:3000')
}
