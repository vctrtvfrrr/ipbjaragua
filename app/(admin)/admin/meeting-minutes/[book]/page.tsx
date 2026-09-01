import { Plus } from 'lucide-react'
import Link from 'next/link'
import { ExportMeetingMinuteBookButton } from '@/components/admin/ExportMeetingMinuteBookButton'
import { MeetingMinuteCard } from '@/components/admin/MeetingMinuteCard'
import { MeetingMinuteYearNav } from '@/components/admin/MeetingMinuteYearNav'
import { buttonVariants } from '@/components/ui/button'
import { earliestMeetingMinuteYear, listMeetingMinutesByYear } from '@/db/queries/meeting-minutes'
import { getCurrentUser } from '@/lib/auth/current-user'
import { meetingMinutePdfCacheExists } from '@/lib/meeting-minute-pdf-cache'
import { churchYear } from '@/lib/date'
import { resolveMeetingMinuteYearNavigation } from '@/lib/meeting-minute'
import { requireMeetingMinuteBookAccess } from '../require-book-access'
import { cn } from '@/lib/utils'

type AdminMeetingMinutesPageProps = {
  params: Promise<{ book: string }>
  searchParams: Promise<{ year?: string }>
}

export default async function AdminMeetingMinutesBookPage({ params, searchParams }: AdminMeetingMinutesPageProps) {
  const book = requireMeetingMinuteBookAccess(await getCurrentUser(), (await params).book)
  const user = await getCurrentUser()
  const { year: rawYear } = await searchParams
  const { year, previousYear, nextYear } = resolveMeetingMinuteYearNavigation(rawYear, {
    earliestYear: await earliestMeetingMinuteYear(book.slug),
    currentYear: churchYear(new Date()),
  })
  // The label distinguishes a first Gerar from a Regenerar, so it asks the volume, not the
  // stored path: a lost file leaves the path behind and there is nothing yet to replace.
  const minutes = await Promise.all(
    (await listMeetingMinutesByYear(year, book.slug)).map(async (minute) => ({
      ...minute,
      cached: await meetingMinutePdfCacheExists(minute.pdf_path),
    }))
  )
  const canCreate = user?.can('meeting_minutes', 'create', book.slug) ?? false
  const canUpdate = user?.can('meeting_minutes', 'update', book.slug) ?? false

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-normal">
          Atas {book.genitive} de {year}
        </h2>
        <div className="flex items-center gap-2">
          <ExportMeetingMinuteBookButton book={book.slug} year={year} />
          {canCreate ? (
            <Link href={`/admin/meeting-minutes/${book.slug}/new`} className={cn(buttonVariants())}>
              <Plus data-icon="inline-start" />
              Nova Ata
            </Link>
          ) : null}
        </div>
      </div>

      {minutes.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border py-12 text-center text-sm">Nenhuma Ata em {year}.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {minutes.map((minute) => (
            <MeetingMinuteCard key={minute.id} book={book.slug} minute={minute} canUpdate={canUpdate} />
          ))}
        </div>
      )}

      <MeetingMinuteYearNav book={book.slug} previousYear={previousYear} nextYear={nextYear} />
    </section>
  )
}
