import { createSessionToken, shouldRenewSession, verifySessionToken } from './session'

export type AdminSessionDecision =
  | { ok: false }
  | {
      ok: true
      renewedToken: string | null
    }

export async function evaluateAdminSession(token: string | undefined, now = new Date()): Promise<AdminSessionDecision> {
  if (!token) return { ok: false }

  const session = await verifySessionToken(token, undefined, now)
  if (!session) return { ok: false }

  if (!shouldRenewSession(session.expiresAt, now)) {
    return { ok: true, renewedToken: null }
  }

  return { ok: true, renewedToken: await createSessionToken(session.userId, undefined, now) }
}
