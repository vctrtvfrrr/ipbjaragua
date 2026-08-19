import { forbidden } from 'next/navigation'
import { MeetingMinuteForm } from '@/components/admin/MeetingMinuteForm'
import { nextMeetingMinuteNumber } from '@/db/queries/meeting-minutes'
import { requirePageRead } from '@/lib/auth/require-page-read'

export default async function NewMeetingMinutePage() {
  const user = await requirePageRead('meeting_minutes')
  if (!user.can('meeting_minutes', 'create')) forbidden()

  const suggestedNumber = await nextMeetingMinuteNumber()

  return (
    <section className="grid gap-6">
      <h2 className="text-xl font-semibold tracking-normal">Nova Ata</h2>
      <MeetingMinuteForm mode="create" suggestedNumber={suggestedNumber} />
    </section>
  )
}
