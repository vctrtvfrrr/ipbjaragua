import { jwtVerify, SignJWT } from 'jose'
import { z } from 'zod'
import { getSessionEnv } from './env'

export const SESSION_COOKIE_NAME = 'ipbjaragua_session'
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30
export const SESSION_RENEWAL_THRESHOLD_SECONDS = 60 * 60 * 24 * 15

const sessionPayloadSchema = z.object({
  sub: z.coerce.number().int().positive(),
  exp: z.number().int().positive(),
})

function getSecretKey(secret = getSessionEnv().SESSION_SECRET): Uint8Array {
  return new TextEncoder().encode(secret)
}

export async function createSessionToken(userId: number, secret?: string, now = new Date()): Promise<string> {
  const issuedAt = Math.floor(now.getTime() / 1000)

  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + SESSION_DURATION_SECONDS)
    .sign(getSecretKey(secret))
}

export async function verifySessionToken(
  token: string,
  secret?: string
): Promise<{ userId: number; expiresAt: Date } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(secret))
    const parsed = sessionPayloadSchema.safeParse(payload)

    if (!parsed.success) return null

    return { userId: parsed.data.sub, expiresAt: new Date(parsed.data.exp * 1000) }
  } catch {
    return null
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  }
}

export function shouldRenewSession(expiresAt: Date, now = new Date()): boolean {
  const remainingSeconds = Math.floor((expiresAt.getTime() - now.getTime()) / 1000)
  return remainingSeconds < SESSION_RENEWAL_THRESHOLD_SECONDS
}
