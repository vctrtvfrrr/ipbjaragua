import { NextResponse, type NextRequest } from 'next/server'
import { evaluateAdminSession } from '@/lib/auth/admin-proxy'
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from '@/lib/auth/session'

export async function proxy(request: NextRequest) {
  const decision = await evaluateAdminSession(request.cookies.get(SESSION_COOKIE_NAME)?.value)

  if (!decision.ok) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const response = NextResponse.next()

  if (decision.renewedToken) {
    response.cookies.set(SESSION_COOKIE_NAME, decision.renewedToken, getSessionCookieOptions())
  }

  return response
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
