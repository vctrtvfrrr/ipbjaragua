import { LiturgyForm } from '@/components/admin/LiturgyForm'
import { listSongPickerOptions } from '@/db/queries/liturgies'
import { requirePageRead } from '@/lib/auth/require-page-read'

export default async function NewLiturgyPage() {
  const user = await requirePageRead('liturgies')
  if (!user.can('liturgies', 'create')) return null

  const songs = await listSongPickerOptions()

  return (
    <section className="grid gap-6">
      <h2 className="text-xl font-semibold tracking-normal">Nova Liturgia</h2>
      <LiturgyForm mode="create" songs={songs} />
    </section>
  )
}
