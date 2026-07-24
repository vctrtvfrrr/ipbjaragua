import Link from 'next/link'
import Pagination from '@/components/Pagination'
import type { Bulletin } from '@/db/queries/bulletins'
import { formatBulletinSubtitle } from '@/lib/bulletin'
import { formatISODate, formatLongDatePtBR } from '@/lib/date'

type Props = {
  bulletins: Bulletin[]
  page: number
  totalPages: number
}

export default function BulletinGrid({ bulletins, page, totalPages }: Props) {
  if (bulletins.length === 0) {
    return <p className="text-muted-foreground">Nenhum boletim publicado ainda.</p>
  }

  return (
    <>
      <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {bulletins.map((bulletin) => (
          <li key={formatISODate(bulletin.date)} className="border-border border-b pb-4">
            <Link href={`/bulletins/${formatISODate(bulletin.date)}`} className="group block">
              <h2 className="font-narrow text-brand-deep text-2xl leading-tight group-hover:underline">
                {formatLongDatePtBR(bulletin.date)}
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {formatBulletinSubtitle(bulletin.edition, bulletin.date)}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {totalPages > 1 ? <Pagination page={page} totalPages={totalPages} basePath="/bulletins" /> : null}
    </>
  )
}
