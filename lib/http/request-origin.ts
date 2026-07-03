import type { NextRequest } from 'next/server'

function firstHeaderValue(value: string | null): string | null {
  return value?.split(',')[0]?.trim() || null
}

export function getPublicOrigin(request: NextRequest): string {
  const requestUrl = new URL(request.url)
  const forwardedHost = firstHeaderValue(request.headers.get('x-forwarded-host'))
  const forwardedProto = firstHeaderValue(request.headers.get('x-forwarded-proto'))
  const protocol = forwardedProto === 'http' || forwardedProto === 'https' ? `${forwardedProto}:` : requestUrl.protocol
  const host = forwardedHost ?? requestUrl.host

  return `${protocol}//${host}`
}

export function publicUrl(path: string, request: NextRequest): URL {
  return new URL(path, getPublicOrigin(request))
}
