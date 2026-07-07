import { BulletinForm } from '@/components/admin/BulletinForm'
import { listBulletinArticleOptions, nextBulletinEdition } from '@/db/queries/bulletins-write'
import { requirePageRead } from '@/lib/auth/require-page-read'

export default async function NewBulletinPage() {
  await requirePageRead('bulletins')
  const [articles, suggestedEdition] = await Promise.all([listBulletinArticleOptions(), nextBulletinEdition()])

  return (
    <section className="grid gap-6">
      <h2 className="text-xl font-semibold tracking-normal">Novo boletim</h2>
      <BulletinForm mode="create" articles={articles} suggestedEdition={suggestedEdition} />
    </section>
  )
}
