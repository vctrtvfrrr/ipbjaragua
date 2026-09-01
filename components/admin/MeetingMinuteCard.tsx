import { ApproveMeetingMinuteButton } from '@/components/admin/ApproveMeetingMinuteButton'
import { MeetingMinutePdfButton } from '@/components/admin/MeetingMinutePdfButton'
import { MeetingMinutePdfCacheButton } from '@/components/admin/MeetingMinutePdfCacheButton'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { formatChurchDatePtBR } from '@/lib/date'
import { MEETING_MINUTE_STATUS_LABELS } from '@/lib/meeting-minute'
import type { MeetingMinuteStatus } from '@/db/schema'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Props = {
  book: string
  minute: {
    id: number
    number: number
    title: string
    started_at: Date
    status: MeetingMinuteStatus
    topics: { title: string }[]
    cached: boolean
  }
  canUpdate: boolean
}

export function MeetingMinuteCard({ book, minute, canUpdate }: Props) {
  const numberId = `meeting-minute-${minute.id}-number`
  const titleId = `meeting-minute-${minute.id}-title`

  return (
    <article aria-labelledby={`${numberId} ${titleId}`} className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="grid gap-1">
          <h3 id={numberId} className="text-lg font-bold tracking-normal">
            {minute.number}ª Ata
          </h3>
          <p id={titleId} className="text-muted-foreground text-sm">
            {minute.title}
          </p>
          <p className="text-muted-foreground text-xs">{formatChurchDatePtBR(minute.started_at)}</p>
        </div>
        <Badge variant={minute.status === 'approved' ? 'outline' : 'secondary'}>
          {MEETING_MINUTE_STATUS_LABELS[minute.status]}
        </Badge>
      </div>

      <div className="grid gap-1">
        <p className="text-muted-foreground text-xs">Tópicos discutidos</p>
        <ol className="list-inside list-decimal">
          {minute.topics.map((topic, index) => (
            <li key={index}>{topic.title}</li>
          ))}
        </ol>
      </div>

      <div className="mt-auto flex flex-wrap justify-end gap-2">
        {canUpdate && minute.status === 'pending' ? (
          <Link
            href={`/admin/meeting-minutes/${book}/${minute.id}/edit`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            Editar
          </Link>
        ) : null}
        <MeetingMinutePdfButton book={book} minute={minute} />
        {minute.status === 'approved' ? <MeetingMinutePdfCacheButton minute={minute} cached={minute.cached} /> : null}
        {canUpdate && minute.status === 'pending' ? <ApproveMeetingMinuteButton minute={minute} /> : null}
      </div>
    </article>
  )
}
