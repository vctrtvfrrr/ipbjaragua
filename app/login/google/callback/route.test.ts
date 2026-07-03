import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { GET } from './route'

describe('Google login callback route', () => {
  it('redirects login errors to the forwarded public origin', async () => {
    const request = new NextRequest('https://0.0.0.0:3000/login/google/callback', {
      headers: {
        'x-forwarded-host': 'ipbjaragua.org.br',
        'x-forwarded-proto': 'https',
      },
    })

    const response = await GET(request)

    expect(response.headers.get('location')).toBe('https://ipbjaragua.org.br/login?erro=login')
  })
})
