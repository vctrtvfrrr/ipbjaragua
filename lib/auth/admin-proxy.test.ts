import { describe, expect, it } from 'vitest'
import { evaluateAdminSession } from './admin-proxy'
import { createSessionToken, verifySessionToken } from './session'

const SECRET = 'a'.repeat(32)

describe('evaluateAdminSession', () => {
  it('redirects when there is no valid cookie', async () => {
    await expect(evaluateAdminSession(undefined)).resolves.toEqual({ ok: false })
    await expect(evaluateAdminSession('invalid')).resolves.toEqual({ ok: false })
  })

  it('does not renew while the session has at least 15 days left', async () => {
    process.env.SESSION_SECRET = SECRET
    const now = new Date('2026-07-02T12:00:00Z')
    const token = await createSessionToken(1, SECRET, new Date('2026-06-22T12:00:00Z'))

    await expect(evaluateAdminSession(token, now)).resolves.toEqual({ ok: true, renewedToken: null })
  })

  it('renews when the session has less than 15 days left', async () => {
    process.env.SESSION_SECRET = SECRET
    const now = new Date('2026-07-02T12:00:00Z')
    const token = await createSessionToken(1, SECRET, new Date('2026-06-17T11:59:59Z'))
    const decision = await evaluateAdminSession(token, now)

    expect(decision.ok).toBe(true)
    expect(decision.ok ? decision.renewedToken : null).toEqual(expect.any(String))
    expect(await verifySessionToken(decision.ok ? decision.renewedToken! : '', SECRET, now)).toMatchObject({
      userId: 1,
      expiresAt: new Date('2026-08-01T12:00:00Z'),
    })
  })
})
