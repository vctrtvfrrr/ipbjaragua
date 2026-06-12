import { and, count, desc, eq, isNull, lte } from 'drizzle-orm'
import { db as defaultDb } from '@/db'
import { articles, bulletins, liturgies } from '@/db/schema'

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
  liturgy: typeof liturgies.$inferSelect | null
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
      liturgy: liturgies,
    })
    .from(bulletins)
    .leftJoin(articles, eq(bulletins.article_id, articles.id))
    .leftJoin(liturgies, eq(bulletins.liturgy_id, liturgies.id))
    .where(and(eq(bulletins.date, date), isNull(bulletins.deleted_at)))
    .get()

  if (!rows) return undefined

  return {
    bulletin: rows.bulletin,
    article: rows.article,
    liturgy: rows.liturgy,
  }
}
