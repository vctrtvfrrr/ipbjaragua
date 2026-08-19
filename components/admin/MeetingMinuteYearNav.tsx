import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  previousYear: number | null
  nextYear: number | null
}

export function MeetingMinuteYearNav({ previousYear, nextYear }: Props) {
  if (previousYear === null && nextYear === null) return null

  return (
    <nav aria-label="Navegação por ano" className="flex items-center justify-between gap-4">
      {previousYear === null ? (
        <span />
      ) : (
        <Link
          href={`/admin/meeting-minutes?year=${previousYear}`}
          aria-label={`Atas de ${previousYear}`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          <ChevronLeft data-icon="inline-start" />
          {previousYear}
        </Link>
      )}
      {nextYear === null ? null : (
        <Link
          href={`/admin/meeting-minutes?year=${nextYear}`}
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
