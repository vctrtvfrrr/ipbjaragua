import { and, count, desc, eq, isNull, sql } from 'drizzle-orm'
import { db as defaultDb, type Database } from '@/db'
import { announcements } from '@/db/schema'

export type Announcement = typeof announcements.$inferSelect

export class AnnouncementNotFoundError extends Error {
  constructor(id: number) {
    super(`Announcement ${id} was not found`)
    this.name = 'AnnouncementNotFoundError'
  }
}

export type CreateAnnouncementInput = {
  title: string
  description: string
  url: string | null
  expires_at: Date
}

export type UpdateAnnouncementInput = Partial<CreateAnnouncementInput>

export async function createAnnouncement(
  input: CreateAnnouncementInput,
  db: Database = defaultDb
): Promise<Announcement> {
  const [announcement] = await db.insert(announcements).values(input).returning()
  return announcement
}

export async function updateAnnouncement(
  id: number,
  input: UpdateAnnouncementInput,
  db: Database = defaultDb
): Promise<Announcement> {
  const [announcement] = await db
    .update(announcements)
    .set(input)
    .where(and(eq(announcements.id, id), isNull(announcements.deleted_at)))
    .returning()

  if (!announcement) throw new AnnouncementNotFoundError(id)
  return announcement
}

export async function softDeleteAnnouncement(id: number, db: Database = defaultDb): Promise<Announcement> {
  const [announcement] = await db
    .update(announcements)
    .set({ deleted_at: sql`CURRENT_TIMESTAMP` })
    .where(and(eq(announcements.id, id), isNull(announcements.deleted_at)))
    .returning()

  if (!announcement) throw new AnnouncementNotFoundError(id)
  return announcement
}

export async function getAnnouncementById(id: number, db: Database = defaultDb): Promise<Announcement | undefined> {
  const rows = await db
    .select()
    .from(announcements)
    .where(and(eq(announcements.id, id), isNull(announcements.deleted_at)))
    .limit(1)
  return rows[0]
}

export async function listAnnouncementsForAdmin(
  { page, pageSize }: { page: number; pageSize: number },
  db: Database = defaultDb
): Promise<Announcement[]> {
  return db
    .select()
    .from(announcements)
    .where(isNull(announcements.deleted_at))
    .orderBy(desc(announcements.expires_at), desc(announcements.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
}

export async function countAnnouncements(db: Database = defaultDb): Promise<number> {
  const [row] = await db.select({ value: count() }).from(announcements).where(isNull(announcements.deleted_at))
  return row?.value ?? 0
}
