import { Plus } from 'lucide-react'
import Link from 'next/link'
import { MeetingMinutePdfButton } from '@/components/admin/MeetingMinutePdfButton'
import { MeetingMinuteTopicList } from '@/components/admin/MeetingMinuteTopicList'
import { MeetingMinuteYearNav } from '@/components/admin/MeetingMinuteYearNav'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { buttonVariants } from '@/components/ui/button'
import { earliestMeetingMinuteYear, listMeetingMinutesByYear } from '@/db/queries/meeting-minutes'
import { requirePageRead } from '@/lib/auth/require-page-read'
import { churchYear, formatChurchDatePtBR } from '@/lib/date'
import {
  MEETING_MINUTE_STATUS_LABELS,
  meetingMinuteLabel,
  resolveMeetingMinuteYearNavigation,
} from '@/lib/meeting-minute'
import { cn } from '@/lib/utils'

type AdminMeetingMinutesPageProps = {
  searchParams: Promise<{ year?: string }>
}

export default async function AdminMeetingMinutesPage({ searchParams }: AdminMeetingMinutesPageProps) {
  const user = await requirePageRead('meeting_minutes')
  const { year: rawYear } = await searchParams
  const { year, previousYear, nextYear } = resolveMeetingMinuteYearNavigation(rawYear, {
    earliestYear: await earliestMeetingMinuteYear(),
    currentYear: churchYear(new Date()),
  })
  const minutes = await listMeetingMinutesByYear(year)
  const canCreate = user.can('meeting_minutes', 'create')
  const canUpdate = user.can('meeting_minutes', 'update')

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
        <p className="text-muted-foreground rounded-lg border py-12 text-center text-sm">Nenhuma Ata em {year}.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Tópicos discutidos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {minutes.map((minute) => (
              <TableRow key={minute.id}>
                <TableCell>{formatChurchDatePtBR(minute.started_at)}</TableCell>
                <TableCell className="font-medium whitespace-normal">{meetingMinuteLabel(minute)}</TableCell>
                <TableCell className="whitespace-normal">
                  <MeetingMinuteTopicList topics={minute.topics} />
                </TableCell>
                <TableCell>{MEETING_MINUTE_STATUS_LABELS[minute.status]}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    {canUpdate && minute.status === 'pending' ? (
                      <Link
                        href={`/admin/meeting-minutes/${minute.id}/edit`}
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                      >
                        Editar
                      </Link>
                    ) : null}
                    <MeetingMinutePdfButton minute={minute} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <MeetingMinuteYearNav previousYear={previousYear} nextYear={nextYear} />
    </section>
  )
}
