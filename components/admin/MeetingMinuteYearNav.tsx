import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  book: string
  previousYear: number | null
  nextYear: number | null
}

export function MeetingMinuteYearNav({ book, previousYear, nextYear }: Props) {
  if (previousYear === null && nextYear === null) return null

  return (
    <nav aria-label="Navegação por ano" className="flex items-center justify-between gap-4">
      {previousYear === null ? (
        <span />
      ) : (
        <Link
          href={`/admin/meeting-minutes/${book}?year=${previousYear}`}
          aria-label={`Atas de ${previousYear}`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          <ChevronLeft data-icon="inline-start" />
          {previousYear}
        </Link>
      )}
      {nextYear === null ? null : (
        <Link
          href={`/admin/meeting-minutes/${book}?year=${nextYear}`}
          aria-label={`Atas de ${nextYear}`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          {nextYear}
          <ChevronRight data-icon="inline-end" />
        </Link>
      )}
    </nav>
  )
}
