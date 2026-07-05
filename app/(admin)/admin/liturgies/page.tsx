import Link from 'next/link'
import { Plus } from 'lucide-react'
import { DeleteLiturgyButton } from '@/components/admin/DeleteLiturgyButton'
import Pagination from '@/components/Pagination'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { countLiturgiesForAdmin, listLiturgiesForAdmin } from '@/db/queries/liturgies'
import { requirePageRead } from '@/lib/auth/require-page-read'
import { formatLongDatePtBR } from '@/lib/date'
import { resolvePage, totalPages } from '@/lib/pagination'

const PAGE_SIZE = 20

type AdminLiturgiesPageProps = {
  searchParams: Promise<{ page?: string | string[] }>
}

export default async function AdminLiturgiesPage({ searchParams }: AdminLiturgiesPageProps) {
  const user = await requirePageRead('liturgies')

  const { page: rawPage } = await searchParams
  const total = await countLiturgiesForAdmin()
  const pages = totalPages(total, PAGE_SIZE)
  const page = resolvePage(rawPage, pages)
  const liturgies = await listLiturgiesForAdmin({ page, pageSize: PAGE_SIZE })

  const canCreate = user.can('liturgies', 'create')
  const canUpdate = user.can('liturgies', 'update')
  const canDelete = user.can('liturgies', 'delete')

  return (
    <section className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-normal">Liturgias</h2>
        {canCreate ? (
          <Button render={<Link href="/admin/liturgies/new" />}>
            <Plus data-icon="inline-start" />
            Nova Liturgia
          </Button>
        ) : null}
      </div>

      {total === 0 ? (
        <div className="text-muted-foreground grid gap-4 rounded-lg border py-12 text-center text-sm">
          <p>Nenhuma Liturgia ainda.</p>
          {canCreate ? (
            <div>
              <Button render={<Link href="/admin/liturgies/new" />}>Criar a primeira Liturgia</Button>
            </div>
          ) : null}
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo de Culto</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Atos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {liturgies.map((liturgy) => (
                <TableRow key={liturgy.id}>
                  <TableCell className="font-medium whitespace-normal">{liturgy.theme}</TableCell>
                  <TableCell>{formatLongDatePtBR(liturgy.date)}</TableCell>
                  <TableCell>{liturgy.time}</TableCell>
                  <TableCell>{liturgy.actsCount}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      {canUpdate ? (
                        <Button
                          variant="outline"
                          size="sm"
                          render={<Link href={`/admin/liturgies/${liturgy.id}/edit`} />}
                        >
                          Editar
                        </Button>
                      ) : null}
                      {canDelete ? <DeleteLiturgyButton liturgy={liturgy} /> : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pages > 1 ? <Pagination page={page} totalPages={pages} basePath="/admin/liturgies" /> : null}
        </>
      )}
    </section>
  )
}
