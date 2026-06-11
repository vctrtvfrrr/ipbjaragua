import ArticleGrid from '@/components/ArticleGrid'
import { countArticles, listArticles } from '@/db/queries/articles'
import { resolvePage, totalPages } from '@/lib/pagination'

const PAGE_SIZE = 50

export default async function ArticlesPage({ searchParams }: PageProps<'/articles'>) {
  const { page: rawPage } = await searchParams
  const total = await countArticles()
  const pages = totalPages(total, PAGE_SIZE)
  const page = resolvePage(rawPage, pages)
  const articles = await listArticles({ page, pageSize: PAGE_SIZE })

  return (
    <section className="container mx-auto py-10 xl:px-0">
      <h2 className="font-narrow mb-5 text-3xl text-green-900 uppercase">Artigos</h2>
      <main>
        <ArticleGrid articles={articles} page={page} totalPages={pages} basePath="/articles" />
      </main>
    </section>
  )
}
