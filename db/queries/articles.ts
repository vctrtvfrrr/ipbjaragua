import { and, count, desc, eq, isNull } from 'drizzle-orm'
import { db as defaultDb, type Database } from '@/db'
import { articles } from '@/db/schema'

export type Article = typeof articles.$inferSelect

export async function getArticleBySlug(slug: string, db: Database = defaultDb): Promise<Article | undefined> {
  const rows = await db
    .select()
    .from(articles)
    .where(and(eq(articles.slug, slug), isNull(articles.deleted_at)))
    .limit(1)
  return rows[0]
}

export async function listArticles(
  { page, pageSize }: { page: number; pageSize: number },
  db: Database = defaultDb
): Promise<Article[]> {
  return db
    .select()
    .from(articles)
    .where(isNull(articles.deleted_at))
    .orderBy(desc(articles.date), desc(articles.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
}

export async function getLatestArticle(db: Database = defaultDb): Promise<Article | undefined> {
  const rows = await db
    .select()
    .from(articles)
    .where(isNull(articles.deleted_at))
    .orderBy(desc(articles.date), desc(articles.id))
    .limit(1)
  return rows[0]
}

export async function countArticles(db: Database = defaultDb): Promise<number> {
  const [row] = await db.select({ value: count() }).from(articles).where(isNull(articles.deleted_at))
  return row?.value ?? 0
}
