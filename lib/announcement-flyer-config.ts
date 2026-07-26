export const MAX_ANNOUNCEMENT_FLYER_BYTES = 5 * 1024 * 1024
export const ANNOUNCEMENT_FLYER_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

export function announcementFlyerUrl(flyerPath: string): string {
  return `/media/announcement-flyers/${flyerPath}`
}
