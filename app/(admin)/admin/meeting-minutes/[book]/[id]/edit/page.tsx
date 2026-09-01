import { forbidden, notFound } from 'next/navigation'
import { MeetingMinuteForm } from '@/components/admin/MeetingMinuteForm'
import { getMeetingMinuteById } from '@/db/queries/meeting-minutes'
import { getCurrentUser } from '@/lib/auth/current-user'
import { requireMeetingMinuteBookAccess } from '../../../require-book-access'
import { requireMeetingMinuteEdit } from '../../../require-edit'

export default async function EditMeetingMinutePage({ params }: PageProps<'/admin/meeting-minutes/[book]/[id]/edit'>) {
  const { book: bookSlug, id } = await params
  const user = await getCurrentUser()
  const book = requireMeetingMinuteBookAccess(user, bookSlug)
  if (!user?.can('meeting_minutes', 'update', book.slug)) forbidden()

  const minuteId = Number(id)
  if (!Number.isInteger(minuteId) || minuteId < 1) notFound()

  const minute = requireMeetingMinuteEdit(book, await getMeetingMinuteById(minuteId))

  return (
    <section className="grid gap-6">
      <h2 className="text-xl font-semibold tracking-normal">Editar Ata {book.genitive}</h2>
      <MeetingMinuteForm mode="edit" book={book} minute={minute} />
    </section>
  )
}
