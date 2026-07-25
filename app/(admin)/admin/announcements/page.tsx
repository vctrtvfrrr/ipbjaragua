import Link from 'next/link'
import { Plus } from 'lucide-react'
import { DeleteAnnouncementButton } from '@/components/admin/DeleteAnnouncementButton'
import Pagination from '@/components/Pagination'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { countAnnouncements, listAnnouncementsForAdmin } from '@/db/queries/announcements'
import { requirePageRead } from '@/lib/auth/require-page-read'
import { formatLongDatePtBR, today } from '@/lib/date'
import { resolvePage, totalPages } from '@/lib/pagination'

const PAGE_SIZE = 20

export default async function AdminAnnouncementsPage({ searchParams }: PageProps<'/admin/announcements'>) {
  const user = await requirePageRead('announcements')

  const { page: rawPage } = await searchParams
  const total = await countAnnouncements()
  const pages = totalPages(total, PAGE_SIZE)
  const page = resolvePage(rawPage, pages)
  const announcements = await listAnnouncementsForAdmin({ page, pageSize: PAGE_SIZE })
  const todayDate = today()

  const canCreate = user.can('announcements', 'create')
  const canUpdate = user.can('announcements', 'update')
  const canDelete = user.can('announcements', 'delete')

  return (
    <section className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-normal">Avisos</h2>
        {canCreate ? (
          <Link href="/admin/announcements/new" className={cn(buttonVariants())}>
            <Plus data-icon="inline-start" />
            Novo aviso
          </Link>
        ) : null}
      </div>

      {total === 0 ? (
        <div className="text-muted-foreground grid gap-4 rounded-lg border py-12 text-center text-sm">
          <p>Nenhum aviso ainda.</p>
          {canCreate ? (
            <div>
              <Link href="/admin/announcements/new" className={cn(buttonVariants())}>
                Criar o primeiro aviso
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
                <TableHead>Exibir até</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Link</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.map((announcement) => {
                const expired = announcement.expires_at < todayDate
                return (
                  <TableRow key={announcement.id}>
                    <TableCell className="font-medium whitespace-normal">{announcement.title}</TableCell>
                    <TableCell>{formatLongDatePtBR(announcement.expires_at)}</TableCell>
                    <TableCell>
                      {expired ? (
                        <Badge variant="secondary">Expirado</Badge>
                      ) : (
                        <span className="text-muted-foreground">Vigente</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-64 truncate">{announcement.url ?? '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {canUpdate ? (
                          <Link
                            href={`/admin/announcements/${announcement.id}/edit`}
                            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                          >
                            Editar
                          </Link>
                        ) : null}
                        {canDelete ? (
                          <DeleteAnnouncementButton announcement={{ id: announcement.id, title: announcement.title }} />
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {pages > 1 ? <Pagination page={page} totalPages={pages} basePath="/admin/announcements" /> : null}
        </>
      )}
    </section>
  )
}
