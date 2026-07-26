import { FileTextIcon } from 'lucide-react'
import Link from 'next/link'
import Pagination from '@/components/Pagination'
import IconTile from '@/components/public/IconTile'
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
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {bulletins.map((bulletin) => (
          <li key={formatISODate(bulletin.date)} className="border-border flex gap-4 rounded-xl border p-5">
            <IconTile icon={FileTextIcon} />
            <div>
              <h2 className="text-brand-deep font-bold">
                <Link
                  href={`/bulletins/${formatISODate(bulletin.date)}`}
                  className="underline-offset-4 hover:underline"
                >
                  {formatLongDatePtBR(bulletin.date)}
                </Link>
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {formatBulletinSubtitle(bulletin.edition, bulletin.date)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {totalPages > 1 ? <Pagination page={page} totalPages={totalPages} basePath="/bulletins" /> : null}
    </>
  )
}
