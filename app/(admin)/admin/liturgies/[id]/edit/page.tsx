import { notFound } from 'next/navigation'
import { LiturgyForm } from '@/components/admin/LiturgyForm'
import { getLiturgyForEditor, listSongPickerOptions } from '@/db/queries/liturgies'
import { requirePageRead } from '@/lib/auth/require-page-read'

type EditLiturgyPageProps = {
  params: Promise<{ id: string }>
}

export default async function EditLiturgyPage({ params }: EditLiturgyPageProps) {
  const user = await requirePageRead('liturgies')
  if (!user.can('liturgies', 'update')) return null

  const { id } = await params
  const liturgyId = Number(id)
  if (!Number.isInteger(liturgyId) || liturgyId < 1) notFound()

  const [liturgy, songs] = await Promise.all([getLiturgyForEditor(liturgyId), listSongPickerOptions()])
  if (!liturgy) notFound()

  return (
    <section className="grid gap-6">
      <h2 className="text-xl font-semibold tracking-normal">Editar Liturgia</h2>
      <LiturgyForm mode="edit" liturgy={liturgy} songs={songs} />
    </section>
  )
}
