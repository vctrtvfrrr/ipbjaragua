import { notFound } from 'next/navigation'
import { BulletinForm } from '@/components/admin/BulletinForm'
import { getBulletinById, isBulletinInCorrectionWindow, listBulletinArticleOptions } from '@/db/queries/bulletins-write'
import { requirePageRead } from '@/lib/auth/require-page-read'
import { today } from '@/lib/date'

type EditBulletinPageProps = {
  params: Promise<{ id: string }>
}

export default async function EditBulletinPage({ params }: EditBulletinPageProps) {
  await requirePageRead('bulletins')

  const { id } = await params
  const bulletin = await getBulletinById(Number(id))
  if (!bulletin) notFound()

  const articles = await listBulletinArticleOptions()
  const canEditDate = isBulletinInCorrectionWindow(bulletin, { today: today(), now: new Date() })

  return (
    <section className="grid gap-6">
      <h2 className="text-xl font-semibold tracking-normal">Editar boletim</h2>
      <BulletinForm mode="edit" bulletin={bulletin} articles={articles} canEditDate={canEditDate} />
    </section>
  )
}
