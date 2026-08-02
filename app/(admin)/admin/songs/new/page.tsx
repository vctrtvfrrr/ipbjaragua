import { forbidden } from 'next/navigation'
import { SongForm } from '@/components/admin/SongForm'
import { requirePageRead } from '@/lib/auth/require-page-read'
import { resolveSongSort, songListPath, type SongSortParams } from '@/lib/song-sort'

type NewSongPageProps = {
  searchParams: Promise<SongSortParams>
}

export default async function NewSongPage({ searchParams }: NewSongPageProps) {
  const user = await requirePageRead('songs')
  if (!user.can('songs', 'create')) forbidden()

  const listPath = songListPath(resolveSongSort(await searchParams))

  return (
    <section className="grid gap-6">
      <h2 className="text-xl font-semibold tracking-normal">Novo cântico</h2>
      <SongForm mode="create" listPath={listPath} />
    </section>
  )
}
