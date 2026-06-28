import { and, count, desc, eq, isNull, lte } from 'drizzle-orm'
import { db as defaultDb, type Database } from '@/db'
import { articles, bulletins } from '@/db/schema'

export type Bulletin = typeof bulletins.$inferSelect

export async function listBulletins(
  { page, pageSize, today }: { page: number; pageSize: number; today: Date },
  db: Database = defaultDb
): Promise<Bulletin[]> {
  return db
    .select()
    .from(bulletins)
    .where(and(isNull(bulletins.deleted_at), lte(bulletins.date, today)))
    .orderBy(desc(bulletins.date))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
}

export async function countBulletins({ today }: { today: Date }, db: Database = defaultDb): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(bulletins)
    .where(and(isNull(bulletins.deleted_at), lte(bulletins.date, today)))
  return row?.value ?? 0
}

export type BulletinWithRefs = {
  bulletin: Bulletin
  article: typeof articles.$inferSelect | null
}

export async function getLatestDominicalBulletin(today: Date, db: Database = defaultDb): Promise<Bulletin | undefined> {
  const rows = await db
    .select()
    .from(bulletins)
    .where(and(isNull(bulletins.deleted_at), lte(bulletins.date, today)))
    .orderBy(desc(bulletins.date))

  return rows.find((b) => b.date.getUTCDay() === 0)
}

export async function listRecentBulletins(
  { today, limit }: { today: Date; limit: number },
  db: Database = defaultDb
): Promise<Bulletin[]> {
  return db
    .select()
    .from(bulletins)
    .where(and(isNull(bulletins.deleted_at), lte(bulletins.date, today)))
    .orderBy(desc(bulletins.date))
    .limit(limit)
}

export async function getBulletinByDate(
  date: Date,
  today: Date,
  db: Database = defaultDb
): Promise<BulletinWithRefs | undefined> {
  if (date > today) return undefined

  const [row] = await db
    .select({
      bulletin: bulletins,
      article: articles,
    })
    .from(bulletins)
    .leftJoin(articles, eq(bulletins.article_id, articles.id))
    .where(and(eq(bulletins.date, date), isNull(bulletins.deleted_at)))
    .limit(1)

  if (!row) return undefined

  return {
    bulletin: row.bulletin,
    article: row.article,
  }
}
