import { forbidden, notFound } from 'next/navigation'
import { SongForm } from '@/components/admin/SongForm'
import { getSongById } from '@/db/queries/songs'
import { requirePageRead } from '@/lib/auth/require-page-read'

type EditSongPageProps = {
  params: Promise<{ id: string }>
}

export default async function EditSongPage({ params }: EditSongPageProps) {
  const user = await requirePageRead('songs')
  if (!user.can('songs', 'update')) forbidden()

  const { id } = await params
  const song = await getSongById(Number(id))

  if (!song) {
    notFound()
  }

  return (
    <section className="grid gap-6">
      <h2 className="text-xl font-semibold tracking-normal">Editar cântico</h2>
      <SongForm mode="edit" song={song} />
    </section>
  )
}
