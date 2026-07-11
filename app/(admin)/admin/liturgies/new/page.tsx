import { LiturgyForm } from '@/components/admin/LiturgyForm'
import { getLiturgyForEditor, listSongPickerOptions } from '@/db/queries/liturgies'
import { requirePageRead } from '@/lib/auth/require-page-read'
import { formatISODate, nextWeekDateForWeekday, today, weekdayOf } from '@/lib/date'
import { buildLiturgyDuplicationDefaults } from '@/lib/liturgy'

type NewLiturgyPageProps = {
  searchParams: Promise<{ from?: string | string[] }>
}

export default async function NewLiturgyPage({ searchParams }: NewLiturgyPageProps) {
  const user = await requirePageRead('liturgies')
  if (!user.can('liturgies', 'create')) return null

  const songs = await listSongPickerOptions()

  const { from } = await searchParams
  const sourceId = typeof from === 'string' ? Number(from) : NaN
  const source = Number.isInteger(sourceId) && sourceId > 0 ? await getLiturgyForEditor(sourceId) : undefined
  const defaults = source
    ? buildLiturgyDuplicationDefaults(source, {
        suggestedDate: formatISODate(nextWeekDateForWeekday(today(), weekdayOf(source.date))),
        activeSongIds: new Set(songs.map((song) => song.id)),
      })
    : undefined

  return (
    <section className="grid gap-6">
      <h2 className="text-xl font-semibold tracking-normal">Nova Liturgia</h2>
      <LiturgyForm mode="create" songs={songs} defaults={defaults} />
    </section>
  )
}
