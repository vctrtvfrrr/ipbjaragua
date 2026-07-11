import { randomBytes } from 'node:crypto'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

export const ARTICLE_FALLBACK_IMAGE = '/images/article-fallback.webp'
export const MAX_FEATURED_IMAGE_BYTES = 5 * 1024 * 1024
const ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

export function featuredImageUrl(imagePath: string | null): string {
  return imagePath ? `/media/featured-images/${imagePath}` : ARTICLE_FALLBACK_IMAGE
}

export function featuredImagesDirectory(): string {
  return path.join(process.env.DATA_DIR ?? '/app/data', 'featured-images')
}

export async function normalizeAndStoreFeaturedImage(file: File): Promise<string> {
  if (!ACCEPTED_TYPES.has(file.type)) throw new Error('Envie uma imagem PNG, JPEG ou WEBP.')
  if (file.size === 0) throw new Error('Selecione uma imagem.')
  if (file.size > MAX_FEATURED_IMAGE_BYTES) throw new Error('A imagem deve ter no máximo 5 MB.')

  const filename = `${randomBytes(24).toString('hex')}.webp`
  const directory = featuredImagesDirectory()
  await mkdir(directory, { recursive: true })
  const normalized = await sharp(await file.arrayBuffer())
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer()
  await writeFile(path.join(directory, filename), normalized, { flag: 'wx' })
  return filename
}

export async function readFeaturedImage(imagePath: string): Promise<Buffer | null> {
  if (!/^[a-f0-9]{48}\.webp$/.test(imagePath)) return null
  try {
    return await readFile(path.join(featuredImagesDirectory(), imagePath))
  } catch {
    return null
  }
}

export async function removeFeaturedImageFile(imagePath: string): Promise<void> {
  try {
    await unlink(path.join(featuredImagesDirectory(), imagePath))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
}
