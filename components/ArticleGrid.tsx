import Link from 'next/link'
import Pagination from '@/components/Pagination'
import ArticleVisual from '@/components/public/ArticleVisual'
import type { ArticleWithAuthor } from '@/db/queries/articles'
import { publicAuthorName } from '@/lib/article'
import { formatLongDatePtBR } from '@/lib/date'

type Props = {
  articles: ArticleWithAuthor[]
  page: number
  totalPages: number
  basePath: string
}

export default function ArticleGrid({ articles, page, totalPages, basePath }: Props) {
  if (articles.length === 0) {
    return <p className="text-muted-foreground">Nenhum artigo publicado ainda.</p>
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 lg:grid-cols-2 xl:grid-cols-3">
        {articles.map((article) => {
          const date = formatLongDatePtBR(article.date)
          const byline = `${publicAuthorName(article)} — ${date}`

          return (
            <article key={article.slug}>
              <Link href={`/articles/${article.slug}`} className="group block">
                <ArticleVisual
                  featuredImagePath={article.featuredImagePath}
                  slug={article.slug}
                  alt=""
                  className="h-48 w-full object-cover"
                />
                <h3 className="text-brand-ridge mt-4 font-serif text-2xl leading-snug group-hover:underline">
                  {article.title}
                </h3>
              </Link>
              <p className="text-muted-foreground mt-2 text-sm">{byline}</p>
              {article.excerpt ? <p className="mt-3">{article.excerpt}</p> : null}
            </article>
          )
        })}
      </div>

      {totalPages > 1 ? <Pagination page={page} totalPages={totalPages} basePath={basePath} /> : null}
    </>
  )
}
