import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { getPublicOrigin, getPublicOriginFromHeaders, publicUrl } from './request-origin'

describe('request public origin', () => {
  it('uses the request origin when there are no forwarded headers', () => {
    const request = new NextRequest('http://localhost:3000/admin')

    expect(getPublicOrigin(request)).toBe('http://localhost:3000')
    expect(publicUrl('/login', request).toString()).toBe('http://localhost:3000/login')
  })

  it('uses the first forwarded host and proto values', () => {
    const request = new NextRequest('https://0.0.0.0:3000/admin', {
      headers: {
        'x-forwarded-host': 'ipbjaragua.org.br, internal.local',
        'x-forwarded-proto': 'https, http',
      },
    })

    expect(getPublicOrigin(request)).toBe('https://ipbjaragua.org.br')
    expect(publicUrl('/login?erro=login', request).toString()).toBe('https://ipbjaragua.org.br/login?erro=login')
  })

  it('derives public origin from forwarded action headers', () => {
    const headers = new Headers({
      host: 'internal.local',
      origin: 'http://internal.local/admin/users/new',
      'x-forwarded-host': 'ipbjaragua.org.br, internal.local',
      'x-forwarded-proto': 'https, http',
    })

    expect(getPublicOriginFromHeaders(headers)).toBe('https://ipbjaragua.org.br')
  })

  it('falls back to host and origin protocol for action headers without forwarded values', () => {
    const headers = new Headers({
      host: 'localhost:3000',
      origin: 'http://localhost:3000/admin/users/new',
    })

    expect(getPublicOriginFromHeaders(headers)).toBe('http://localhost:3000')
  })
})
