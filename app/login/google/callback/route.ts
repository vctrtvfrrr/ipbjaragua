import { decodeIdToken } from 'arctic'
import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { resolveGoogleLogin } from '@/lib/auth/google-login'
import {
  GOOGLE_CODE_VERIFIER_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  getGoogleOAuthClient,
  getOAuthTransientCookieOptions,
} from '@/lib/auth/oauth'
import { createSessionToken, getSessionCookieOptions, SESSION_COOKIE_NAME } from '@/lib/auth/session'

function loginError(request: NextRequest, reason: string): NextResponse {
  console.warn('Google login denied:', reason)
  const response = NextResponse.redirect(new URL('/login?erro=login', request.url))
  clearOAuthTransientCookies(response)
  return response
}

function clearOAuthTransientCookies(response: NextResponse) {
  const transientOptions = getOAuthTransientCookieOptions()
  response.cookies.delete({ name: GOOGLE_OAUTH_STATE_COOKIE, path: transientOptions.path })
  response.cookies.delete({ name: GOOGLE_CODE_VERIFIER_COOKIE, path: transientOptions.path })
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const storedState = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value
  const codeVerifier = request.cookies.get(GOOGLE_CODE_VERIFIER_COOKIE)?.value

  if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
    return loginError(request, 'invalid_oauth_state')
  }

  try {
    const tokens = await getGoogleOAuthClient().validateAuthorizationCode(code, codeVerifier)
    const result = await resolveGoogleLogin(db, decodeIdToken(tokens.idToken()))

    if (!result.ok) {
      return loginError(request, result.reason)
    }

    const response = NextResponse.redirect(new URL('/admin', request.url))
    clearOAuthTransientCookies(response)
    response.cookies.set(SESSION_COOKIE_NAME, await createSessionToken(result.userId), getSessionCookieOptions())
    return response
  } catch (error) {
    console.error('Google login callback failed:', error)
    return loginError(request, 'callback_exception')
  }
}
