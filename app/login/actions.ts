'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  createGoogleAuthorizationRequest,
  GOOGLE_CODE_VERIFIER_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  getOAuthTransientCookieOptions,
} from '@/lib/auth/oauth'

export async function startGoogleLogin() {
  const { state, codeVerifier, url } = createGoogleAuthorizationRequest()
  const cookieStore = await cookies()
  const options = getOAuthTransientCookieOptions()

  cookieStore.set(GOOGLE_OAUTH_STATE_COOKIE, state, options)
  cookieStore.set(GOOGLE_CODE_VERIFIER_COOKIE, codeVerifier, options)

  redirect(url.toString())
}
