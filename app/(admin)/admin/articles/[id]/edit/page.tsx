import { notFound } from 'next/navigation'
import { ArticleForm } from '@/components/admin/ArticleForm'
import { getArticleById, listAuthorOptions } from '@/db/queries/articles'
import { requirePageRead } from '@/lib/auth/require-page-read'

export default async function EditArticlePage({ params }: PageProps<'/admin/articles/[id]/edit'>) {
  const user = await requirePageRead('articles')

  const { id } = await params
  const article = await getArticleById(Number(id))

  if (!article) {
    notFound()
  }

  const authors = await listAuthorOptions(article.author_id)

  return (
    <section className="grid gap-6">
      <h2 className="text-xl font-semibold tracking-normal">Editar artigo</h2>
      <ArticleForm mode="edit" article={article} users={authors} currentUserId={user.id} />
    </section>
  )
}
