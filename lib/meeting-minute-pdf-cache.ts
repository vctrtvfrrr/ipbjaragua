import { randomBytes } from 'node:crypto'
import { access, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { storageDirectory } from '@/lib/media-file'

const NAME = /^[a-f0-9]{48}\.pdf$/

function cacheDirectory(): string {
  return storageDirectory('meeting-minute-pdfs')
}

export function newMeetingMinutePdfCacheName(): string {
  return `${randomBytes(24).toString('hex')}.pdf`
}

// The stored path is data, not a promise: a name the application did not mint is refused
// rather than joined onto the media directory.
function resolveCacheFile(name: string): string | null {
  return NAME.test(name) ? path.join(/* turbopackIgnore: true */ cacheDirectory(), name) : null
}

// Only a file that is not there is a missing cache. A volume that is unmounted or unreadable
// answers with a different code, and swallowing it would turn a storage fault into an endless
// rebuild loop the operator never gets told about.
function rethrowUnlessMissing(error: unknown): void {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
}

export async function readMeetingMinutePdfCache(name: string | null): Promise<Buffer | null> {
  const file = name ? resolveCacheFile(name) : null
  if (!file) return null

  try {
    return await readFile(file)
  } catch (error) {
    rethrowUnlessMissing(error)
    return null
  }
}

export async function meetingMinutePdfCacheExists(name: string | null): Promise<boolean> {
  const file = name ? resolveCacheFile(name) : null
  if (!file) return false

  try {
    await access(file)
    return true
  } catch (error) {
    rethrowUnlessMissing(error)
    return false
  }
}

// The bytes land under a scratch name and are renamed into place, so a reader never opens a
// half-written document and two regenerations racing leave the last rename standing — no
// partial file, no second version kept.
export async function writeMeetingMinutePdfCache(name: string, pdf: Buffer): Promise<void> {
  const file = resolveCacheFile(name)
  if (!file) throw new Error(`Refusing to write a meeting minute PDF cache named "${name}"`)

  await mkdir(cacheDirectory(), { recursive: true })
  const scratch = `${file}.${randomBytes(8).toString('hex')}.part`

  try {
    await writeFile(scratch, pdf)
    await rename(scratch, file)
  } catch (error) {
    await unlink(scratch).catch(() => undefined)
    throw error
  }
}
