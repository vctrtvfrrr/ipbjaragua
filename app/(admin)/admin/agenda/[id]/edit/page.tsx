import { forbidden, notFound } from 'next/navigation'
import { AgendaForm } from '@/components/admin/AgendaForm'
import { getAgendaItemById } from '@/db/queries/agenda'
import { requirePageRead } from '@/lib/auth/require-page-read'

type EditAgendaPageProps = {
  params: Promise<{ id: string }>
}

export default async function EditAgendaPage({ params }: EditAgendaPageProps) {
  const user = await requirePageRead('agenda')

  if (!user.can('agenda', 'update')) forbidden()

  const { id } = await params
  const item = await getAgendaItemById(Number(id))

  if (!item) {
    notFound()
  }

  return (
    <section className="grid gap-6">
      <h2 className="text-xl font-semibold tracking-normal">Editar evento</h2>
      <AgendaForm mode="edit" item={item} />
    </section>
  )
}
