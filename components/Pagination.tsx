import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

type Props = {
  page: number
  totalPages: number
  basePath: string
}

export default function Pagination({ page, totalPages, basePath }: Props) {
  return (
    <nav aria-label="Paginação" className="mt-10 flex items-center justify-center gap-6">
      {page > 1 ? (
        <Link href={`${basePath}?page=${page - 1}`} className={buttonVariants({ variant: 'link' })}>
          ← Anterior
        </Link>
      ) : null}
      <span className="text-muted-foreground">
        Página {page} de {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={`${basePath}?page=${page + 1}`} className={buttonVariants({ variant: 'link' })}>
          Próxima →
        </Link>
      ) : null}
    </nav>
  )
}
