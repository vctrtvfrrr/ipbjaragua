import { and, count, desc, eq, isNull, lte } from 'drizzle-orm'
import { db as defaultDb } from '@/db'
import { articles, bulletins } from '@/db/schema'

export type Bulletin = typeof bulletins.$inferSelect

type Database = typeof defaultDb

export async function listBulletins(
  { page, pageSize, today }: { page: number; pageSize: number; today: string },
  db: Database = defaultDb
): Promise<Bulletin[]> {
  return db
    .select()
    .from(bulletins)
    .where(and(isNull(bulletins.deleted_at), lte(bulletins.date, today)))
    .orderBy(desc(bulletins.date))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .all()
}

export async function countBulletins(
  { today }: { today: string },
  db: Database = defaultDb
): Promise<number> {
  const row = db
    .select({ value: count() })
    .from(bulletins)
    .where(and(isNull(bulletins.deleted_at), lte(bulletins.date, today)))
    .get()
  return row?.value ?? 0
}

export type BulletinWithRefs = {
  bulletin: Bulletin
  article: typeof articles.$inferSelect | null
}

export async function getLatestDominicalBulletin(
  today: string,
  db: Database = defaultDb
): Promise<Bulletin | undefined> {
  // Fetch recent published bulletins in descending order and find the first Sunday.
  // SQLite's strftime('%w', date) returns '0' for Sunday, but we handle it in JS
  // to keep the query portable and the filter logic consistent with weekdayOf().
  const rows = db
    .select()
    .from(bulletins)
    .where(and(isNull(bulletins.deleted_at), lte(bulletins.date, today)))
    .orderBy(desc(bulletins.date))
    .all()

  return rows.find((b) => new Date(`${b.date}T00:00:00Z`).getUTCDay() === 0)
}

export async function listRecentBulletins(
  { today, limit }: { today: string; limit: number },
  db: Database = defaultDb
): Promise<Bulletin[]> {
  return db
    .select()
    .from(bulletins)
    .where(and(isNull(bulletins.deleted_at), lte(bulletins.date, today)))
    .orderBy(desc(bulletins.date))
    .limit(limit)
    .all()
}

export async function getBulletinByDate(
  date: string,
  today: string,
  db: Database = defaultDb
): Promise<BulletinWithRefs | undefined> {
  if (date > today) return undefined

  const rows = db
    .select({
      bulletin: bulletins,
      article: articles,
    })
    .from(bulletins)
    .leftJoin(articles, eq(bulletins.article_id, articles.id))
    .where(and(eq(bulletins.date, date), isNull(bulletins.deleted_at)))
    .get()

  if (!rows) return undefined

  return {
    bulletin: rows.bulletin,
    article: rows.article,
  }
}
