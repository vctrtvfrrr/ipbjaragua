import Link from 'next/link'
import { Plus } from 'lucide-react'
import { DeleteSongButton } from '@/components/admin/DeleteSongButton'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { listSongsForAdmin } from '@/db/queries/songs'
import { requirePageRead } from '@/lib/auth/require-page-read'

export default async function AdminSongsPage() {
  const user = await requirePageRead('songs')

  const songs = await listSongsForAdmin()

  const canCreate = user.can('songs', 'create')
  const canUpdate = user.can('songs', 'update')
  const canDelete = user.can('songs', 'delete')

  return (
    <section className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-normal">Cânticos</h2>
        {canCreate ? (
          <Link href="/admin/songs/new" className={cn(buttonVariants())}>
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
              <Link href="/admin/songs/new" className={cn(buttonVariants())}>
                Criar o primeiro cântico
              </Link>
            </div>
          ) : null}
        </div>
      ) : (
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
      )}
    </section>
  )
}
