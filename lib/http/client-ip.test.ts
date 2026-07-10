import { describe, expect, it } from 'vitest'
import { clientIpFrom } from './client-ip'

describe('clientIpFrom', () => {
  it('prioritizes CF-Connecting-IP over X-Forwarded-For', () => {
    const headers = new Headers({ 'cf-connecting-ip': '203.0.113.1', 'x-forwarded-for': '198.51.100.1' })

    expect(clientIpFrom(headers)).toBe('203.0.113.1')
  })

  it('uses the first forwarded address when Cloudflare is absent', () => {
    expect(clientIpFrom(new Headers({ 'x-forwarded-for': '198.51.100.1, 10.0.0.1' }))).toBe('198.51.100.1')
  })

  it('falls back to X-Real-IP and then unknown', () => {
    expect(clientIpFrom(new Headers({ 'x-real-ip': '198.51.100.2' }))).toBe('198.51.100.2')
    expect(clientIpFrom(new Headers())).toBe('unknown')
  })
})
