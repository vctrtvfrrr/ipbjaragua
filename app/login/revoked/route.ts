import { type NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { publicUrl } from '@/lib/http/request-origin'

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(publicUrl('/login', request))
  response.cookies.delete(SESSION_COOKIE_NAME)
  return response
}
