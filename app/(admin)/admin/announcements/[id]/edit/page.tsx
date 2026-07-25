import { forbidden, notFound } from 'next/navigation'
import { AnnouncementForm } from '@/components/admin/AnnouncementForm'
import { getAnnouncementById } from '@/db/queries/announcements'
import { listFeaturedImages } from '@/db/queries/featured-images'
import { requirePageRead } from '@/lib/auth/require-page-read'
import { featuredImageUrl } from '@/lib/featured-image'

export default async function EditAnnouncementPage({ params }: PageProps<'/admin/announcements/[id]/edit'>) {
  const user = await requirePageRead('announcements')

  if (!user.can('announcements', 'update')) forbidden()

  const { id } = await params
  const announcement = await getAnnouncementById(Number(id))

  if (!announcement) {
    notFound()
  }

  const images = (await listFeaturedImages()).map((image) => ({ id: image.id, url: featuredImageUrl(image.path) }))

  return (
    <section className="grid gap-6">
      <h2 className="text-xl font-semibold tracking-normal">Editar aviso</h2>
      <AnnouncementForm mode="edit" announcement={announcement} images={images} />
    </section>
  )
}
