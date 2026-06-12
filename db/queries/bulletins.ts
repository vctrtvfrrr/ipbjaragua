import { and, count, desc, isNull } from 'drizzle-orm'
import { db as defaultDb } from '@/db'
import { bulletins } from '@/db/schema'

export type Bulletin = typeof bulletins.$inferSelect

type Database = typeof defaultDb

export async function listBulletins(
  { page, pageSize }: { page: number; pageSize: number },
  db: Database = defaultDb,
): Promise<Bulletin[]> {
  return db
    .select()
    .from(bulletins)
    .where(isNull(bulletins.deleted_at))
    .orderBy(desc(bulletins.date))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .all()
}

export async function countBulletins(db: Database = defaultDb): Promise<number> {
  const row = db.select({ value: count() }).from(bulletins).where(isNull(bulletins.deleted_at)).get()
  return row?.value ?? 0
}
