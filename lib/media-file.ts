import { randomBytes } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { access, mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import sharp from 'sharp'

type MediaFileOptions = {
  directory: string
  extension: 'png' | 'webp'
  maxWidth: number
}

export function storageDirectory(name: string): string {
  return path.join(/* turbopackIgnore: true */ process.env.MEDIA_STORAGE_PATH ?? '/app/data', name)
}

export async function normalizeAndStoreMediaFile(file: File, options: MediaFileOptions): Promise<string> {
  const filename = `${randomBytes(24).toString('hex')}.${options.extension}`
  await mkdir(options.directory, { recursive: true })

  const image = sharp(await file.arrayBuffer())
    .rotate()
    .resize({ width: options.maxWidth, withoutEnlargement: true })
  const normalized =
    options.extension === 'png' ? await image.png().toBuffer() : await image.webp({ quality: 80 }).toBuffer()

  await writeFile(path.join(/* turbopackIgnore: true */ options.directory, filename), normalized, { flag: 'wx' })
  return filename
}

export async function streamMediaFile(
  filename: string,
  options: Pick<MediaFileOptions, 'directory' | 'extension'>
): Promise<ReadableStream | null> {
  const pattern = new RegExp(`^[a-f0-9]{48}\\.${options.extension}$`)
  if (!pattern.test(filename)) return null

  try {
    const filePath = path.join(/* turbopackIgnore: true */ options.directory, filename)
    await access(filePath)
    return Readable.toWeb(createReadStream(filePath)) as ReadableStream
  } catch {
    return null
  }
}

export async function removeMediaFile(filename: string, directory: string): Promise<void> {
  try {
    await unlink(path.join(/* turbopackIgnore: true */ directory, filename))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
}
