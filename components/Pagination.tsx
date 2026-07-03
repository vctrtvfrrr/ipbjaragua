import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Props = {
  page: number
  totalPages: number
  basePath: string
}

export default function Pagination({ page, totalPages, basePath }: Props) {
  return (
    <nav aria-label="Paginação" className="mt-10 flex items-center justify-center gap-6">
      {page > 1 ? (
        <Button variant="link" render={<Link href={`${basePath}?page=${page - 1}`} />}>
          ← Anterior
        </Button>
      ) : null}
      <span className="text-gray-500">
        Página {page} de {totalPages}
      </span>
      {page < totalPages ? (
        <Button variant="link" render={<Link href={`${basePath}?page=${page + 1}`} />}>
          Próxima →
        </Button>
      ) : null}
    </nav>
  )
}
