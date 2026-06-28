import Link from 'next/link'
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
    return <p className="text-gray-500">Nenhum boletim publicado ainda.</p>
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
        {bulletins.map((bulletin) => (
          <div key={formatISODate(bulletin.date)}>
            <Link href={`/bulletins/${formatISODate(bulletin.date)}`}>
              <h3 className="font-narrow mt-4 mb-2 text-2xl leading-7">{formatLongDatePtBR(bulletin.date)}</h3>
            </Link>
            <small className="mb-2 block text-gray-500">
              {formatBulletinSubtitle(bulletin.edition, bulletin.date)}
            </small>
          </div>
        ))}
      </div>

      {totalPages > 1 ? <Pagination page={page} totalPages={totalPages} /> : null}
    </>
  )
}

function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  return (
    <nav aria-label="Paginação" className="mt-10 flex items-center justify-center gap-6">
      {page > 1 ? (
        <Link href={`/bulletins?page=${page - 1}`} className="text-green-900">
          ← Anterior
        </Link>
      ) : null}
      <span className="text-gray-500">
        Página {page} de {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={`/bulletins?page=${page + 1}`} className="text-green-900">
          Próxima →
        </Link>
      ) : null}
    </nav>
  )
}
