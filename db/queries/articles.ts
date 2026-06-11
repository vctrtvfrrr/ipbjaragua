import { and, count, desc, eq, isNull } from 'drizzle-orm'
import { db as defaultDb } from '@/db'
import { articles } from '@/db/schema'

export type Article = typeof articles.$inferSelect

type Database = typeof defaultDb

export async function getArticleBySlug(slug: string, db: Database = defaultDb): Promise<Article | undefined> {
  return db
    .select()
    .from(articles)
    .where(and(eq(articles.slug, slug), isNull(articles.deleted_at)))
    .get()
}

export async function listArticles(
  { page, pageSize }: { page: number; pageSize: number },
  db: Database = defaultDb,
): Promise<Article[]> {
  return db
    .select()
    .from(articles)
    .where(isNull(articles.deleted_at))
    .orderBy(desc(articles.date), desc(articles.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .all()
}

export async function countArticles(db: Database = defaultDb): Promise<number> {
  const row = db.select({ value: count() }).from(articles).where(isNull(articles.deleted_at)).get()
  return row?.value ?? 0
}
