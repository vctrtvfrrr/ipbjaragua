import Link from 'next/link'
import { Plus } from 'lucide-react'
import { DeleteSongButton } from '@/components/admin/DeleteSongButton'
import Pagination from '@/components/Pagination'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { countSongs, listSongsForAdmin } from '@/db/queries/songs'
import { requirePageRead } from '@/lib/auth/require-page-read'
import { resolvePage, totalPages } from '@/lib/pagination'

const PAGE_SIZE = 20

type AdminSongsPageProps = {
  searchParams: Promise<{ page?: string | string[] }>
}

export default async function AdminSongsPage({ searchParams }: AdminSongsPageProps) {
  const user = await requirePageRead('songs')

  const { page: rawPage } = await searchParams
  const total = await countSongs()
  const pages = totalPages(total, PAGE_SIZE)
  const page = resolvePage(rawPage, pages)
  const songs = await listSongsForAdmin({ page, pageSize: PAGE_SIZE })

  const canCreate = user.can('songs', 'create')
  const canUpdate = user.can('songs', 'update')
  const canDelete = user.can('songs', 'delete')

  return (
    <section className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-normal">Músicas</h2>
        {canCreate ? (
          <Link href="/admin/songs/new" className={cn(buttonVariants())}>
            <Plus data-icon="inline-start" />
            Nova música
          </Link>
        ) : null}
      </div>

      {total === 0 ? (
        <div className="text-muted-foreground grid gap-4 rounded-lg border py-12 text-center text-sm">
          <p>Nenhuma música ainda.</p>
          {canCreate ? (
            <div>
              <Link href="/admin/songs/new" className={cn(buttonVariants())}>
                Criar a primeira música
              </Link>
            </div>
          ) : null}
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Referência</TableHead>
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
                          href={`/admin/songs/${song.id}/edit`}
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

          {pages > 1 ? <Pagination page={page} totalPages={pages} basePath="/admin/songs" /> : null}
        </>
      )}
    </section>
  )
}
