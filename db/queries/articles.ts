import { and, eq, isNull } from 'drizzle-orm'
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
