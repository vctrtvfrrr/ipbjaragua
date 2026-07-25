import Link from 'next/link'
import { CopyPlus, Plus } from 'lucide-react'
import { DeleteAgendaButton } from '@/components/admin/DeleteAgendaButton'
import Pagination from '@/components/Pagination'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { countPastAgendaItems, listFutureAgendaItems, listPastAgendaItems, type AgendaItem } from '@/db/queries/agenda'
import { requirePageRead } from '@/lib/auth/require-page-read'
import { formatLongDatePtBR, today } from '@/lib/date'
import { resolvePage, totalPages } from '@/lib/pagination'

const PAGE_SIZE = 20

type AdminAgendaPageProps = {
  searchParams: Promise<{ page?: string | string[] }>
}

export default async function AdminAgendaPage({ searchParams }: AdminAgendaPageProps) {
  const user = await requirePageRead('agenda')

  const todayDate = today()
  const { page: rawPage } = await searchParams
  const pastTotal = await countPastAgendaItems(todayDate)
  const pages = totalPages(pastTotal, PAGE_SIZE)
  const page = resolvePage(rawPage, pages)
  const [futureItems, pastItems] = await Promise.all([
    listFutureAgendaItems(todayDate),
    listPastAgendaItems({ today: todayDate, page, pageSize: PAGE_SIZE }),
  ])

  const canCreate = user.can('agenda', 'create')
  const canUpdate = user.can('agenda', 'update')
  const canDelete = user.can('agenda', 'delete')
  const total = futureItems.length + pastTotal

  return (
    <section className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-normal">Agenda</h2>
        {canCreate ? (
          <Link href="/admin/agenda/new" className={cn(buttonVariants())}>
            <Plus data-icon="inline-start" />
            Novo evento
          </Link>
        ) : null}
      </div>

      {total === 0 ? (
        <div className="text-muted-foreground grid gap-4 rounded-lg border py-12 text-center text-sm">
          <p>Nenhum evento ainda.</p>
          {canCreate ? (
            <div>
              <Link href="/admin/agenda/new" className={cn(buttonVariants())}>
                Criar o primeiro evento
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
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {futureItems.map((item) => (
                <AgendaRow
                  key={item.id}
                  item={item}
                  canCreate={canCreate}
                  canUpdate={canUpdate}
                  canDelete={canDelete}
                />
              ))}
              {pastItems.length > 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="bg-muted/40 text-muted-foreground text-xs font-medium uppercase">
                    Eventos passados
                  </TableCell>
                </TableRow>
              ) : null}
              {pastItems.map((item) => (
                <AgendaRow
                  key={item.id}
                  item={item}
                  canCreate={canCreate}
                  canUpdate={canUpdate}
                  canDelete={canDelete}
                />
              ))}
            </TableBody>
          </Table>

          {pages > 1 ? <Pagination page={page} totalPages={pages} basePath="/admin/agenda" /> : null}
        </>
      )}
    </section>
  )
}

function AgendaRow({
  item,
  canCreate,
  canUpdate,
  canDelete,
}: {
  item: AgendaItem
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}) {
  return (
    <TableRow>
      <TableCell className="font-medium whitespace-normal">{item.title}</TableCell>
      <TableCell>{formatLongDatePtBR(item.event_date)}</TableCell>
      <TableCell>{item.time ? item.time.slice(0, 5) : 'Dia inteiro'}</TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          {canUpdate ? (
            <Link
              href={`/admin/agenda/${item.id}/edit`}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              Editar
            </Link>
          ) : null}
          {canCreate ? (
            <Link
              href={`/admin/agenda/new?from=${item.id}`}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              <CopyPlus data-icon="inline-start" />
              Repetir
            </Link>
          ) : null}
          {canDelete ? <DeleteAgendaButton item={{ id: item.id, title: item.title }} /> : null}
        </div>
      </TableCell>
    </TableRow>
  )
}
