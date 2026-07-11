import Image from 'next/image'
import Link from 'next/link'
import Pagination from '@/components/Pagination'
import type { ArticleWithAuthor } from '@/db/queries/articles'
import { publicAuthorName } from '@/lib/article'
import { formatLongDatePtBR } from '@/lib/date'
import { featuredImageUrl } from '@/lib/featured-image'

type Props = {
  articles: ArticleWithAuthor[]
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
          const byline = `${publicAuthorName(article)} — ${date}`

          return (
            <div key={article.slug}>
              <Link href={`/articles/${article.slug}`}>
                <Image
                  className="h-48 w-full rounded object-cover"
                  src={featuredImageUrl(article.featuredImagePath)}
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
