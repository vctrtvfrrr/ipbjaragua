import { forbidden, notFound } from 'next/navigation'
import type { MeetingMinuteWithTopics } from '@/db/queries/meeting-minutes'
import type { CurrentUser } from '@/lib/auth/current-user'

export function requireMeetingMinuteEdit(
  user: CurrentUser,
  minute: MeetingMinuteWithTopics | null
): MeetingMinuteWithTopics {
  if (!user.can('meeting_minutes', 'update')) forbidden()
  if (!minute) notFound()
  if (minute.status !== 'pending') forbidden()

  return minute
}
