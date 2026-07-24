import ArticleGrid from '@/components/ArticleGrid'
import PageHeader from '@/components/public/PageHeader'
import { countArticles, listArticles } from '@/db/queries/articles'
import { institutionalMetadata } from '@/lib/og/metadata'
import { resolvePage, totalPages } from '@/lib/pagination'

export const metadata = institutionalMetadata('articles')

const PAGE_SIZE = 50

export default async function ArticlesPage({ searchParams }: PageProps<'/articles'>) {
  const { page: rawPage } = await searchParams
  const total = await countArticles()
  const pages = totalPages(total, PAGE_SIZE)
  const page = resolvePage(rawPage, pages)
  const articles = await listArticles({ page, pageSize: PAGE_SIZE })

  return (
    <main>
      <PageHeader eyebrow="Publicações" title="Artigos" />
      <section className="container mx-auto px-5 pt-6 pb-20 md:px-8">
        <ArticleGrid articles={articles} page={page} totalPages={pages} basePath="/articles" />
      </section>
    </main>
  )
}
