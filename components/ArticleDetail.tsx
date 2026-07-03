import type { Article } from '@/db/queries/articles'
import { formatLongDatePtBR } from '@/lib/date'
import Markdown from './Markdown'

export default function ArticleDetail({ article }: { article: Article }) {
  const date = formatLongDatePtBR(article.date)
  const byline = article.author ? `${article.author} — ${date}` : date

  return (
    <>
      <div
        className="overflow-hidden bg-gray-300 bg-cover bg-center inset-shadow-sm"
        style={{
          height: '420px',
          backgroundImage: 'url(/images/featured-image.png)',
        }}
      />

      <main className="container mx-auto px-4 py-10 xl:px-0">
        <header className="mb-8">
          <h1 className="font-narrow text-4xl leading-tight text-green-900">{article.title}</h1>
          <small className="mt-3 block text-gray-500">{byline}</small>
        </header>

        <article className="prose prose-lg max-w-none">
          <Markdown content={article.content} />
        </article>
      </main>
    </>
  )
}
