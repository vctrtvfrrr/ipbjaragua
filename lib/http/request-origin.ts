import type { NextRequest } from 'next/server'

export function firstHeaderValue(value: string | null): string | null {
  return value?.split(',')[0]?.trim() || null
}

function protocolFrom(value: string | null): 'http:' | 'https:' | null {
  if (value === 'http' || value === 'https') return `${value}:`
  return null
}

function protocolFromOrigin(value: string | null): 'http:' | 'https:' | null {
  if (!value) return null

  try {
    const protocol = new URL(value).protocol
    return protocol === 'http:' || protocol === 'https:' ? protocol : null
  } catch {
    return null
  }
}

export function getPublicOrigin(request: NextRequest): string {
  const requestUrl = new URL(request.url)
  const forwardedHost = firstHeaderValue(request.headers.get('x-forwarded-host'))
  const protocol = protocolFrom(firstHeaderValue(request.headers.get('x-forwarded-proto'))) ?? requestUrl.protocol
  const host = forwardedHost ?? requestUrl.host

  return originFrom(protocol, host)
}

export function getPublicOriginFromHeaders(headers: Headers): string | null {
  const host = firstHeaderValue(headers.get('x-forwarded-host')) ?? firstHeaderValue(headers.get('host'))
  if (!host) return null

  const protocol =
    protocolFrom(firstHeaderValue(headers.get('x-forwarded-proto'))) ??
    protocolFromOrigin(firstHeaderValue(headers.get('origin'))) ??
    'https:'

  return originFrom(protocol, host)
}

export function publicUrl(path: string, request: NextRequest): URL {
  return new URL(path, getPublicOrigin(request))
}

function originFrom(protocol: string, host: string): string {
  return `${protocol}//${host}`
}
