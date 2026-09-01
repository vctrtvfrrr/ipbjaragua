import { getCurrentUser } from '@/lib/auth/current-user'
import { requireMeetingMinuteBookAccess } from '../require-book-access'

export default async function MeetingMinuteBookLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ book: string }>
}) {
  const { book } = await params
  requireMeetingMinuteBookAccess(await getCurrentUser(), book)

  return children
}
