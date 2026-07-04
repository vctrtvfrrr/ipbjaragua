import { ArticleForm } from '@/components/admin/ArticleForm'
import { listAuthorOptions } from '@/db/queries/articles'
import { requirePageRead } from '@/lib/auth/require-page-read'

export default async function NewArticlePage() {
  const user = await requirePageRead('articles')
  const authors = await listAuthorOptions()

  return (
    <section className="grid gap-6">
      <h2 className="text-xl font-semibold tracking-normal">Novo artigo</h2>
      <ArticleForm mode="create" users={authors} currentUserId={user.id} />
    </section>
  )
}
