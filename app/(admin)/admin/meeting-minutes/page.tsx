import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { buttonVariants } from '@/components/ui/button'
import { listMeetingMinutesByYear } from '@/db/queries/meeting-minutes'
import { requirePageRead } from '@/lib/auth/require-page-read'
import { churchYear, formatChurchDateTimePtBR } from '@/lib/date'
import { MEETING_MINUTE_STATUS_LABELS, resolveMeetingMinuteYear } from '@/lib/meeting-minute'
import { cn } from '@/lib/utils'

type AdminMeetingMinutesPageProps = {
  searchParams: Promise<{ year?: string }>
}

export default async function AdminMeetingMinutesPage({ searchParams }: AdminMeetingMinutesPageProps) {
  const user = await requirePageRead('meeting_minutes')
  const { year: rawYear } = await searchParams
  const year = resolveMeetingMinuteYear(rawYear, churchYear(new Date()))
  const minutes = await listMeetingMinutesByYear(year)
  const canCreate = user.can('meeting_minutes', 'create')

  return (
    <section className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-normal">Atas de {year}</h2>
        {canCreate ? (
          <Link href="/admin/meeting-minutes/new" className={cn(buttonVariants())}>
            <Plus data-icon="inline-start" />
            Nova Ata
          </Link>
        ) : null}
      </div>

      {minutes.length === 0 ? (
        <div className="text-muted-foreground grid gap-4 rounded-lg border py-12 text-center text-sm">
          <p>Nenhuma Ata em {year}.</p>
          {canCreate ? (
            <div>
              <Link href="/admin/meeting-minutes/new" className={cn(buttonVariants())}>
                Criar a primeira Ata
              </Link>
            </div>
          ) : null}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {minutes.map((minute) => (
              <TableRow key={minute.id}>
                <TableCell>{minute.number}</TableCell>
                <TableCell className="font-medium whitespace-normal">{minute.title}</TableCell>
                <TableCell>{formatChurchDateTimePtBR(minute.started_at)}</TableCell>
                <TableCell>{MEETING_MINUTE_STATUS_LABELS[minute.status]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  )
}
