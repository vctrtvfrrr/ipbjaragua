import { forbidden, notFound } from 'next/navigation'
import { MeetingMinuteForm } from '@/components/admin/MeetingMinuteForm'
import { getMeetingMinuteById } from '@/db/queries/meeting-minutes'
import { requirePageRead } from '@/lib/auth/require-page-read'

export default async function EditMeetingMinutePage({ params }: PageProps<'/admin/meeting-minutes/[id]/edit'>) {
  const user = await requirePageRead('meeting_minutes')
  if (!user.can('meeting_minutes', 'update')) forbidden()

  const { id } = await params
  const minute = await getMeetingMinuteById(Number(id))

  if (!minute) notFound()
  if (minute.status !== 'pending') forbidden()

  return (
    <section className="grid gap-6">
      <h2 className="text-xl font-semibold tracking-normal">Editar Ata</h2>
      <MeetingMinuteForm mode="edit" minute={minute} />
    </section>
  )
}
