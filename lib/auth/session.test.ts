import { describe, expect, it } from 'vitest'
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_DURATION_SECONDS,
  shouldRenewSession,
  verifySessionToken,
} from './session'

const SECRET = 'a'.repeat(32)

describe('session tokens', () => {
  it('signs a token with only the user id plus JWT timestamps', async () => {
    const issuedAt = new Date('2026-07-02T12:00:00Z')
    const token = await createSessionToken(12, SECRET, issuedAt)
    const session = await verifySessionToken(token, SECRET, issuedAt)

    expect(session?.userId).toBe(12)
    expect(session?.expiresAt).toEqual(new Date('2026-08-01T12:00:00Z'))
  })

  it('rejects invalid tokens', async () => {
    await expect(verifySessionToken('not-a-token', SECRET)).resolves.toBeNull()
  })

  it('uses the required cookie flags', () => {
    expect(getSessionCookieOptions()).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DURATION_SECONDS,
    })
  })

  it('renews only below the sliding-session threshold', () => {
    const now = new Date('2026-07-02T12:00:00Z')

    expect(shouldRenewSession(new Date('2026-07-17T11:59:59Z'), now)).toBe(true)
    expect(shouldRenewSession(new Date('2026-07-17T12:00:00Z'), now)).toBe(false)
  })
})
