import { generateCodeVerifier, generateState, Google } from 'arctic'
import { getAuthEnv } from './env'

export const GOOGLE_OAUTH_STATE_COOKIE = 'google_oauth_state'
export const GOOGLE_CODE_VERIFIER_COOKIE = 'google_code_verifier'
export const OAUTH_TRANSIENT_COOKIE_MAX_AGE = 60 * 10

export function getOAuthTransientCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/login',
    maxAge: OAUTH_TRANSIENT_COOKIE_MAX_AGE,
  }
}

export function getGoogleOAuthClient() {
  const env = getAuthEnv()
  return new Google(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_OAUTH_REDIRECT_URI)
}

export function createGoogleAuthorizationRequest() {
  const state = generateState()
  const codeVerifier = generateCodeVerifier()
  const url = getGoogleOAuthClient().createAuthorizationURL(state, codeVerifier, ['openid', 'email', 'profile'])

  return { state, codeVerifier, url }
}
