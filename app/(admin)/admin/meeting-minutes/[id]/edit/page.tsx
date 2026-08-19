import { notFound } from 'next/navigation'
import { MeetingMinuteForm } from '@/components/admin/MeetingMinuteForm'
import { getMeetingMinuteById } from '@/db/queries/meeting-minutes'
import { requirePageRead } from '@/lib/auth/require-page-read'
import { requireMeetingMinuteEdit } from '../../require-edit'

export default async function EditMeetingMinutePage({ params }: PageProps<'/admin/meeting-minutes/[id]/edit'>) {
  const user = await requirePageRead('meeting_minutes')

  const { id } = await params
  const minuteId = Number(id)
  if (!Number.isInteger(minuteId) || minuteId < 1) notFound()

  const minute = requireMeetingMinuteEdit(user, await getMeetingMinuteById(minuteId))

  return (
    <section className="grid gap-6">
      <h2 className="text-xl font-semibold tracking-normal">Editar Ata</h2>
      <MeetingMinuteForm mode="edit" minute={minute} />
    </section>
  )
}
