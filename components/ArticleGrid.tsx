import Image from 'next/image'
import Link from 'next/link'
import type { Article } from '@/db/queries/articles'
import { formatLongDatePtBR } from '@/lib/date'
import { Button } from '@/components/ui/button'

type Props = {
  articles: Article[]
  page: number
  totalPages: number
  basePath: string
}

export default function ArticleGrid({ articles, page, totalPages, basePath }: Props) {
  if (articles.length === 0) {
    return <p className="text-gray-500">Nenhum artigo publicado ainda.</p>
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 lg:grid-cols-2 xl:grid-cols-3">
        {articles.map((article) => {
          const date = formatLongDatePtBR(article.date)
          const byline = article.author ? `${article.author} — ${date}` : date

          return (
            <div key={article.slug}>
              <Link href={`/articles/${article.slug}`}>
                <Image
                  className="h-auto w-full rounded"
                  src="/images/featured-image.png"
                  width={340}
                  height={100}
                  alt={article.title}
                />
                <h3 className="font-narrow mt-4 mb-2 text-2xl leading-7">{article.title}</h3>
              </Link>
              <small className="mb-2 block text-gray-500">{byline}</small>
              {article.excerpt ? <p className="text-justify">{article.excerpt}</p> : null}
            </div>
          )
        })}
      </div>

      {totalPages > 1 ? <Pagination page={page} totalPages={totalPages} basePath={basePath} /> : null}
    </>
  )
}

function Pagination({ page, totalPages, basePath }: { page: number; totalPages: number; basePath: string }) {
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
