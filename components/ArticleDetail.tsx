import ArticleVisual from '@/components/public/ArticleVisual'
import PageHeader from '@/components/public/PageHeader'
import type { ArticleWithAuthor } from '@/db/queries/articles'
import { publicAuthorName } from '@/lib/article'
import { formatLongDatePtBR } from '@/lib/date'
import Markdown from './Markdown'

export default function ArticleDetail({ article }: { article: ArticleWithAuthor }) {
  const date = formatLongDatePtBR(article.date)
  const byline = `${publicAuthorName(article)} — ${date}`

  return (
    <main>
      <PageHeader eyebrow="Artigo" title={article.title}>
        <p className="text-muted-foreground mt-4">{byline}</p>
      </PageHeader>

      <div className="container mx-auto px-5 pt-6 pb-20 md:px-8">
        <div>
          <ArticleVisual
            featuredImagePath={article.featuredImagePath}
            slug={article.slug}
            alt=""
            className="h-56 w-full rounded-xl object-cover md:h-72"
          />

          <article className="prose prose-lg prose-headings:font-serif prose-headings:text-brand-ridge mt-10 max-w-none">
            <Markdown content={article.content} />
          </article>
        </div>
      </div>
    </main>
  )
}
