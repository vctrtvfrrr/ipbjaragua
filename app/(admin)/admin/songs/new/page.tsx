import { forbidden } from 'next/navigation'
import { SongForm } from '@/components/admin/SongForm'
import { requirePageRead } from '@/lib/auth/require-page-read'

export default async function NewSongPage() {
  const user = await requirePageRead('songs')
  if (!user.can('songs', 'create')) forbidden()

  return (
    <section className="grid gap-6">
      <h2 className="text-xl font-semibold tracking-normal">Nova música</h2>
      <SongForm mode="create" />
    </section>
  )
}
