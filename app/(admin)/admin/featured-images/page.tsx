import Image from 'next/image'
import { ExternalLink } from 'lucide-react'
import { DeleteFeaturedImageButton } from '@/components/admin/DeleteFeaturedImageButton'
import { FeaturedImageUpload } from '@/components/admin/FeaturedImageUpload'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { listFeaturedImages } from '@/db/queries/featured-images'
import { requirePageRead } from '@/lib/auth/require-page-read'
import { featuredImageUrl } from '@/lib/featured-image'

export default async function FeaturedImagesPage() {
  const user = await requirePageRead('featured_images')
  const images = await listFeaturedImages()
  return (
    <section className="grid gap-6">
      <h2 className="text-xl font-semibold tracking-normal">Imagens Destacadas</h2>
      {user.can('featured_images', 'create') ? <FeaturedImageUpload /> : null}
      {images.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border py-12 text-center text-sm">Nenhuma imagem ainda.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => {
            const url = featuredImageUrl(image.path)
            return (
              <article key={image.id} className="grid gap-3 rounded-lg border p-3">
                <Image className="aspect-video w-full rounded object-cover" src={url} alt="" width={480} height={270} />
                <div className="flex justify-end gap-2">
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                  >
                    <ExternalLink data-icon="inline-start" />
                    Abrir
                  </a>
                  {user.can('featured_images', 'delete') ? <DeleteFeaturedImageButton id={image.id} /> : null}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
