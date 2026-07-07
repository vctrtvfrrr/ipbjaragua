import { forbidden } from 'next/navigation'
import { AgendaForm } from '@/components/admin/AgendaForm'
import { getAgendaItemById } from '@/db/queries/agenda'
import { requirePageRead } from '@/lib/auth/require-page-read'
import { nextWeekDateForWeekday, today, weekdayOf } from '@/lib/date'

type NewAgendaPageProps = {
  searchParams: Promise<{ from?: string | string[] }>
}

export default async function NewAgendaPage({ searchParams }: NewAgendaPageProps) {
  const user = await requirePageRead('agenda')

  if (!user.can('agenda', 'create')) forbidden()

  const { from } = await searchParams
  const sourceId = typeof from === 'string' ? Number(from) : NaN
  const source = Number.isInteger(sourceId) && sourceId > 0 ? await getAgendaItemById(sourceId) : undefined
  const defaults = source
    ? {
        title: source.title,
        description: source.description,
        time: source.time,
        event_date: nextWeekDateForWeekday(today(), weekdayOf(source.event_date)),
      }
    : undefined

  return (
    <section className="grid gap-6">
      <h2 className="text-xl font-semibold tracking-normal">Novo evento</h2>
      <AgendaForm mode="create" defaults={defaults} />
    </section>
  )
}
