import { forbidden, notFound } from 'next/navigation'
import type { CurrentUser } from '@/lib/auth/current-user'
import { meetingMinuteBookBySlug, type MeetingMinuteBookDefinition } from '@/lib/meeting-minute-books'

// The Permissão of a Livro is checked once here, in the route's own layout — the same shape as
// `requireMeetingMinuteEdit` — so the rule is testable without a browser and every page and
// route nested under `[book]` inherits the decision instead of repeating it.
export function requireMeetingMinuteBookAccess(user: CurrentUser | null, slug: string): MeetingMinuteBookDefinition {
  const book = meetingMinuteBookBySlug(slug)
  if (!book) notFound()
  if (!user || !user.can('meeting_minutes', 'read', book.slug)) forbidden()

  return book
}
