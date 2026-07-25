import Link from 'next/link'
import { Eye, Plus } from 'lucide-react'
import { DeleteBulletinButton } from '@/components/admin/DeleteBulletinButton'
import Pagination from '@/components/Pagination'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  countBulletinsForAdmin,
  isBulletinInCorrectionWindow,
  listBulletinsForAdmin,
} from '@/db/queries/bulletins-write'
import { requirePageRead } from '@/lib/auth/require-page-read'
import { formatISODate, formatLongDatePtBR, today } from '@/lib/date'
import { resolvePage, totalPages } from '@/lib/pagination'

const PAGE_SIZE = 20

type AdminBulletinsPageProps = {
  searchParams: Promise<{ page?: string }>
}

export default async function AdminBulletinsPage({ searchParams }: AdminBulletinsPageProps) {
  const user = await requirePageRead('bulletins')
  const { page: rawPage } = await searchParams
  const total = await countBulletinsForAdmin()
  const pages = totalPages(total, PAGE_SIZE)
  const page = resolvePage(rawPage, pages)
  const bulletins = await listBulletinsForAdmin({ page, pageSize: PAGE_SIZE })
  const todayDate = today()
  const now = new Date()

  const canCreate = user.can('bulletins', 'create')
  const canUpdate = user.can('bulletins', 'update')
  const canDelete = user.can('bulletins', 'delete')

  return (
    <section className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-normal">Boletins</h2>
        {canCreate ? (
          <Link href="/admin/bulletins/new" className={cn(buttonVariants())}>
            <Plus data-icon="inline-start" />
            Novo boletim
          </Link>
        ) : null}
      </div>

      {total === 0 ? (
        <div className="text-muted-foreground grid gap-4 rounded-lg border py-12 text-center text-sm">
          <p>Nenhum boletim ainda.</p>
          {canCreate ? (
            <div>
              <Link href="/admin/bulletins/new" className={cn(buttonVariants())}>
                Criar o primeiro boletim
              </Link>
            </div>
          ) : null}
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Edição</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Artigo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bulletins.map((bulletin) => {
                const isDraft = bulletin.date > todayDate
                const canCorrect = isBulletinInCorrectionWindow(bulletin, { today: todayDate, now })
                const publicPath = `/bulletins/${formatISODate(bulletin.date)}${isDraft ? '?preview=1' : ''}`

                return (
                  <TableRow key={bulletin.id}>
                    <TableCell>{bulletin.edition}</TableCell>
                    <TableCell className="font-medium whitespace-normal">{bulletin.title}</TableCell>
                    <TableCell>{formatLongDatePtBR(bulletin.date)}</TableCell>
                    <TableCell>{isDraft ? 'Rascunho' : 'Publicado'}</TableCell>
                    <TableCell>{bulletin.articleTitle ?? 'Nenhum'}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={publicPath}
                          target="_blank"
                          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                        >
                          <Eye data-icon="inline-start" />
                          Preview
                        </Link>
                        {canUpdate ? (
                          <Link
                            href={`/admin/bulletins/${bulletin.id}/edit`}
                            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                          >
                            Editar
                          </Link>
                        ) : null}
                        {canDelete && canCorrect ? (
                          <DeleteBulletinButton
                            bulletin={{ id: bulletin.id, title: bulletin.title, edition: bulletin.edition }}
                          />
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {pages > 1 ? <Pagination page={page} totalPages={pages} basePath="/admin/bulletins" /> : null}
        </>
      )}
    </section>
  )
}
