import { desc, eq, isNull, sql } from 'drizzle-orm';
import type { ArticleDetail } from '../../../shared/article';
import type { DbInstance } from '../../db/client';
import { articles } from '../../db/schema';

export type { ArticleDetail };

export type ArticleListItem = {
  id: number;
  slug: string;
  title: string;
  author: string | null;
  date: string;
  excerpt: string | null;
};

export type ArticleListResponse = {
  data: ArticleListItem[];
  pagination: { page: number; limit: number; total: number };
};

export function listArticles(db: DbInstance, page: number, limit: number): ArticleListResponse {
  const totalRow = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(articles)
    .where(isNull(articles.deleted_at))
    .get();
  const total = totalRow?.count ?? 0;

  const data = db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      author: articles.author,
      date: articles.date,
      excerpt: articles.excerpt,
    })
    .from(articles)
    .where(isNull(articles.deleted_at))
    .orderBy(desc(articles.date))
    .limit(limit)
    .offset((page - 1) * limit)
    .all();

  return { data, pagination: { page, limit, total } };
}

export function getArticle(db: DbInstance, slug: string): ArticleDetail | null | 'deleted' {
  const row = db.select().from(articles).where(eq(articles.slug, slug)).limit(1).get();
  if (!row) return null;
  if (row.deleted_at !== null) return 'deleted';
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    author: row.author,
    date: row.date,
    content: row.content,
  };
}
