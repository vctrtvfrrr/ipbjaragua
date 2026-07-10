import { firstHeaderValue } from './request-origin'

export function clientIpFrom(headers: Headers): string {
  return (
    firstHeaderValue(headers.get('cf-connecting-ip')) ??
    firstHeaderValue(headers.get('x-forwarded-for')) ??
    firstHeaderValue(headers.get('x-real-ip')) ??
    'unknown'
  )
}
