import Link from 'next/link'
import { ArrowDown, ArrowUp, ChevronsUpDown, Plus } from 'lucide-react'
import { DeleteSongButton } from '@/components/admin/DeleteSongButton'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { listSongsForAdmin, type SongSort, type SongSortDirection, type SongSortField } from '@/db/queries/songs'
import { requirePageRead } from '@/lib/auth/require-page-read'
import { resolveSongSort, songListPath, songSortQuery, type SongSortParams } from '@/lib/song-sort'

type AdminSongsPageProps = {
  searchParams: Promise<SongSortParams>
}

export default async function AdminSongsPage({ searchParams }: AdminSongsPageProps) {
  const user = await requirePageRead('songs')

  const sort = resolveSongSort(await searchParams)
  const songs = await listSongsForAdmin(sort)
  const sortQuery = songSortQuery(sort)

  const canCreate = user.can('songs', 'create')
  const canUpdate = user.can('songs', 'update')
  const canDelete = user.can('songs', 'delete')

  return (
    <section className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-normal">Cânticos</h2>
        {canCreate ? (
          <Link href={`/admin/songs/new?${sortQuery}`} className={cn(buttonVariants())}>
            <Plus data-icon="inline-start" />
            Novo cântico
          </Link>
        ) : null}
      </div>

      {songs.length === 0 ? (
        <div className="text-muted-foreground grid gap-4 rounded-lg border py-12 text-center text-sm">
          <p>Nenhum cântico ainda.</p>
          {canCreate ? (
            <div>
              <Link href={`/admin/songs/new?${sortQuery}`} className={cn(buttonVariants())}>
                Criar o primeiro cântico
              </Link>
            </div>
          ) : null}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead field="title" label="Título" sort={sort} />
              <SortableHead field="reference" label="Referência" sort={sort} />
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {songs.map((song) => (
              <TableRow key={song.id}>
                <TableCell className="font-medium whitespace-normal">{song.title}</TableCell>
                <TableCell>{song.songReference ?? 'Sem referência'}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    {canUpdate ? (
                      <Link
                        href={`/admin/songs/${song.id}/edit?${sortQuery}`}
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                      >
                        Editar
                      </Link>
                    ) : null}
                    {canDelete ? <DeleteSongButton song={{ id: song.id, title: song.title }} /> : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  )
}

function SortableHead({ field, label, sort }: { field: SongSortField; label: string; sort: SongSort }) {
  const active = sort.field === field
  const nextDirection: SongSortDirection = active && sort.direction === 'asc' ? 'desc' : 'asc'
  const Icon = !active ? ChevronsUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown

  return (
    <TableHead>
      <Link
        href={songListPath({ field, direction: nextDirection })}
        aria-label={`Ordenar por ${label}`}
        className="hover:text-brand-ridge inline-flex items-center gap-1.5"
      >
        {label}
        <Icon className={cn('size-3.5', !active && 'opacity-40')} />
      </Link>
    </TableHead>
  )
}
