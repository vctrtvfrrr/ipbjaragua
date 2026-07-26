import { normalizeAndStoreMediaFile, removeMediaFile, storageDirectory, streamMediaFile } from '@/lib/media-file'

export const ARTICLE_FALLBACK_IMAGE = '/images/article-fallback.webp'
export const MAX_FEATURED_IMAGE_BYTES = 15 * 1024 * 1024
const ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

export function featuredImageUrl(imagePath: string | null): string {
  return imagePath ? `/media/featured-images/${imagePath}` : ARTICLE_FALLBACK_IMAGE
}

export function featuredImagesDirectory(): string {
  return storageDirectory('featured-images')
}

export async function normalizeAndStoreFeaturedImage(file: File): Promise<string> {
  if (!ACCEPTED_TYPES.has(file.type)) throw new Error('Envie uma imagem PNG, JPEG ou WEBP.')
  if (file.size === 0) throw new Error('Selecione uma imagem.')
  if (file.size > MAX_FEATURED_IMAGE_BYTES) throw new Error('A imagem deve ter no máximo 15 MB.')

  return normalizeAndStoreMediaFile(file, {
    directory: featuredImagesDirectory(),
    extension: 'webp',
    maxWidth: 1600,
  })
}

export async function streamFeaturedImage(imagePath: string): Promise<ReadableStream | null> {
  return streamMediaFile(imagePath, { directory: featuredImagesDirectory(), extension: 'webp' })
}

export async function removeFeaturedImageFile(imagePath: string): Promise<void> {
  return removeMediaFile(imagePath, featuredImagesDirectory())
}
