import { forbidden } from 'next/navigation'
import { AnnouncementForm } from '@/components/admin/AnnouncementForm'
import { listFeaturedImages } from '@/db/queries/featured-images'
import { requirePageRead } from '@/lib/auth/require-page-read'

export default async function NewAnnouncementPage() {
  const user = await requirePageRead('announcements')

  if (!user.can('announcements', 'create')) forbidden()

  const images = await listFeaturedImages()

  return (
    <section className="grid gap-6">
      <h2 className="text-xl font-semibold tracking-normal">Novo aviso</h2>
      <AnnouncementForm mode="create" canCreateAgenda={user.can('agenda', 'create')} images={images} />
    </section>
  )
}
