import { normalizeAndStoreMediaFile, removeMediaFile, storageDirectory, streamMediaFile } from '@/lib/media-file'
import sharp from 'sharp'
export {
  announcementFlyerUrl,
  ANNOUNCEMENT_FLYER_TYPES,
  MAX_ANNOUNCEMENT_FLYER_BYTES,
} from '@/lib/announcement-flyer-config'

export function announcementFlyersDirectory(): string {
  return storageDirectory('announcement-flyers')
}

export async function normalizeAndStoreAnnouncementFlyer(file: File): Promise<string> {
  const metadata = await sharp(await file.arrayBuffer()).metadata()
  if (!metadata.format || !['png', 'jpeg', 'webp'].includes(metadata.format)) {
    throw new InvalidAnnouncementFlyerError()
  }

  return normalizeAndStoreMediaFile(file, {
    directory: announcementFlyersDirectory(),
    extension: 'png',
    maxWidth: 1080,
  })
}

export class InvalidAnnouncementFlyerError extends Error {
  constructor() {
    super('Announcement flyer contents must be PNG, JPEG, or WEBP')
    this.name = 'InvalidAnnouncementFlyerError'
  }
}

export async function streamAnnouncementFlyer(flyerPath: string): Promise<ReadableStream | null> {
  return streamMediaFile(flyerPath, { directory: announcementFlyersDirectory(), extension: 'png' })
}

export async function removeAnnouncementFlyerFile(flyerPath: string): Promise<void> {
  return removeMediaFile(flyerPath, announcementFlyersDirectory())
}
