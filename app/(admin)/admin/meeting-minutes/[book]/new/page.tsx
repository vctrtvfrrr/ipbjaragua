import { forbidden } from 'next/navigation'
import { MeetingMinuteForm } from '@/components/admin/MeetingMinuteForm'
import { nextMeetingMinuteNumber } from '@/db/queries/meeting-minutes'
import { getCurrentUser } from '@/lib/auth/current-user'
import { requireMeetingMinuteBookAccess } from '../../require-book-access'

export default async function NewMeetingMinutePage({ params }: PageProps<'/admin/meeting-minutes/[book]/new'>) {
  const user = await getCurrentUser()
  const book = requireMeetingMinuteBookAccess(user, (await params).book)
  if (!user?.can('meeting_minutes', 'create', book.slug)) forbidden()

  const suggestedNumber = await nextMeetingMinuteNumber(book.slug)

  return (
    <section className="grid gap-6">
      <h2 className="text-xl font-semibold tracking-normal">Nova Ata {book.genitive}</h2>
      <MeetingMinuteForm mode="create" book={book} suggestedNumber={suggestedNumber} />
    </section>
  )
}
