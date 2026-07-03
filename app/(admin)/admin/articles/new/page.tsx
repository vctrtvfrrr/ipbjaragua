import { ArticleForm } from '@/components/admin/ArticleForm'
import { requirePageRead } from '@/lib/auth/require-page-read'

export default async function NewArticlePage() {
  await requirePageRead('articles')

  return (
    <section className="grid max-w-2xl gap-6">
      <h2 className="text-xl font-semibold tracking-normal">Novo artigo</h2>
      <ArticleForm mode="create" />
    </section>
  )
}
