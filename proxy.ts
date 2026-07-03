import { type NextRequest, NextResponse } from 'next/server'
import { evaluateAdminSession } from '@/lib/auth/admin-proxy'
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { publicUrl } from '@/lib/http/request-origin'

export async function proxy(request: NextRequest) {
  const decision = await evaluateAdminSession(request.cookies.get(SESSION_COOKIE_NAME)?.value)

  if (!decision.ok) {
    return NextResponse.redirect(publicUrl('/login', request))
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
