import Link from 'next/link'
import { CopyPlus, Plus } from 'lucide-react'
import { DeleteAgendaButton } from '@/components/admin/DeleteAgendaButton'
import Pagination from '@/components/Pagination'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  countPastAgendaItems,
  listPastAgendaItems,
  listUpcomingAgendaItems,
  type AgendaItem,
} from '@/db/queries/agenda'
import { requirePageRead } from '@/lib/auth/require-page-read'
import { currentTimeHHMM, formatLongDatePtBR, today } from '@/lib/date'
import { resolvePage, totalPages } from '@/lib/pagination'

const PAGE_SIZE = 20

type AdminAgendaPageProps = {
  searchParams: Promise<{ page?: string | string[] }>
}

export default async function AdminAgendaPage({ searchParams }: AdminAgendaPageProps) {
  const user = await requirePageRead('agenda')

  // One clock reading, so date and time cannot straddle midnight and describe different days.
  const clock = new Date()
  const now = { date: today(clock), time: currentTimeHHMM(clock) }
  const { page: rawPage } = await searchParams
  const pastTotal = await countPastAgendaItems(now)
  const pages = totalPages(pastTotal, PAGE_SIZE)
  const page = resolvePage(rawPage, pages)
  const [upcomingItems, pastItems] = await Promise.all([
    listUpcomingAgendaItems(now),
    listPastAgendaItems({ now, page, pageSize: PAGE_SIZE }),
  ])

  const canCreate = user.can('agenda', 'create')
  const canUpdate = user.can('agenda', 'update')
  const canDelete = user.can('agenda', 'delete')
  const total = upcomingItems.length + pastTotal

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
          <div className="grid gap-3">
            <h3 className="text-base font-semibold tracking-normal">Próximos eventos</h3>
            {upcomingItems.length === 0 ? (
              <p className="text-muted-foreground rounded-lg border px-4 py-6 text-center text-sm">
                Nenhum evento futuro.
              </p>
            ) : (
              <AgendaTable items={upcomingItems} canCreate={canCreate} canUpdate={canUpdate} canDelete={canDelete} />
            )}
          </div>

          {pastItems.length > 0 ? (
            <div className="grid gap-3">
              <h3 className="text-base font-semibold tracking-normal">Eventos passados</h3>
              <AgendaTable items={pastItems} canCreate={canCreate} canUpdate={canUpdate} canDelete={canDelete} />
              {pages > 1 ? <Pagination page={page} totalPages={pages} basePath="/admin/agenda" /> : null}
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}

type AgendaPermissions = { canCreate: boolean; canUpdate: boolean; canDelete: boolean }

function AgendaTable({ items, ...permissions }: { items: AgendaItem[] } & AgendaPermissions) {
  return (
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
        {items.map((item) => (
          <AgendaRow key={item.id} item={item} {...permissions} />
        ))}
      </TableBody>
    </Table>
  )
}

function AgendaRow({ item, canCreate, canUpdate, canDelete }: { item: AgendaItem } & AgendaPermissions) {
  return (
    <TableRow>
      <TableCell className="align-top font-medium whitespace-normal">
        {item.title}
        {item.description ? (
          <span className="text-muted-foreground mt-0.5 block text-xs font-normal">{item.description}</span>
        ) : null}
      </TableCell>
      <TableCell className="align-top">{formatLongDatePtBR(item.event_date)}</TableCell>
      <TableCell className="align-top">{item.time ? item.time.slice(0, 5) : 'Dia inteiro'}</TableCell>
      <TableCell className="align-top">
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
