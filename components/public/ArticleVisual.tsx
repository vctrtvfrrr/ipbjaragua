import Image from 'next/image'
import PublicationTile from '@/components/brand/PublicationTile'
import { featuredImageUrl } from '@/lib/featured-image'

type Props = {
  featuredImagePath: string | null
  slug: string
  alt: string
  className?: string
}

export default function ArticleVisual({ featuredImagePath, slug, alt, className }: Props) {
  if (!featuredImagePath) return <PublicationTile kind="article" seed={slug} className={className} />

  return (
    <Image src={featuredImageUrl(featuredImagePath)} alt={alt} width={800} height={450} className={className} />
  )
}
