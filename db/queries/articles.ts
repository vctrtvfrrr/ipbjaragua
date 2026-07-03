import { and, count, desc, eq, inArray, isNull, ne, sql } from 'drizzle-orm'
import { db as defaultDb, type Database } from '@/db'
import { articles } from '@/db/schema'
import { buildSlugCandidates, writeWithAllocatedSlug } from './slug'

export type Article = typeof articles.$inferSelect

export class ArticleNotFoundError extends Error {
  constructor(id: number) {
    super(`Article ${id} was not found`)
    this.name = 'ArticleNotFoundError'
  }
}

export class ArticleSlugCollisionError extends Error {
  constructor(slug: string) {
    super(`Could not allocate article slug "${slug}"`)
    this.name = 'ArticleSlugCollisionError'
  }
}

export type CreateArticleInput = {
  title: string
  slug: string
  author: string | null
  date: Date
  excerpt: string | null
  content: string
}

export type UpdateArticleInput = {
  title?: string
  slug?: string
  author?: string | null
  date?: Date
  excerpt?: string | null
  content?: string
}

type ArticleWriteValues = Partial<Omit<CreateArticleInput, 'slug'>>

export async function createArticle(input: CreateArticleInput, db: Database = defaultDb): Promise<Article> {
  const occupiedSlugs = await listOccupiedArticleSlugs(input.slug, db)

  return writeWithAllocatedSlug({
    baseSlug: input.slug,
    occupiedSlugs,
    createCollisionError: (slug) => new ArticleSlugCollisionError(slug),
    tryWrite: async (slug) => {
      const [article] = await db
        .insert(articles)
        .values({ ...input, slug })
        .returning()
      return article
    },
  })
}

export async function updateArticle(id: number, input: UpdateArticleInput, db: Database = defaultDb): Promise<Article> {
  const current = await getActiveArticleById(id, db)
  const values = buildArticleUpdateValues(input)

  if (input.slug === undefined || input.slug === current.slug) {
    if (Object.keys(values).length === 0) return current
    return updateActiveArticle(id, values, db)
  }

  const occupiedSlugs = await listOccupiedArticleSlugs(input.slug, db, id)

  return writeWithAllocatedSlug({
    baseSlug: input.slug,
    occupiedSlugs,
    createCollisionError: (slug) => new ArticleSlugCollisionError(slug),
    tryWrite: (slug) => updateActiveArticle(id, { ...values, slug }, db),
  })
}

export async function softDeleteArticle(id: number, db: Database = defaultDb): Promise<Article> {
  const [article] = await db
    .update(articles)
    .set({ deleted_at: sql`CURRENT_TIMESTAMP` })
    .where(and(eq(articles.id, id), isNull(articles.deleted_at)))
    .returning()

  if (!article) throw new ArticleNotFoundError(id)
  return article
}

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

async function getActiveArticleById(id: number, db: Database): Promise<Article> {
  const [article] = await db
    .select()
    .from(articles)
    .where(and(eq(articles.id, id), isNull(articles.deleted_at)))
    .limit(1)

  if (!article) throw new ArticleNotFoundError(id)
  return article
}

async function updateActiveArticle(
  id: number,
  values: ArticleWriteValues & { slug?: string },
  db: Database
): Promise<Article> {
  const [article] = await db
    .update(articles)
    .set(values)
    .where(and(eq(articles.id, id), isNull(articles.deleted_at)))
    .returning()

  if (!article) throw new ArticleNotFoundError(id)
  return article
}

async function listOccupiedArticleSlugs(slug: string, db: Database, excludeId?: number): Promise<string[]> {
  const candidates = buildSlugCandidates(slug)
  const conditions = [inArray(articles.slug, candidates)]
  if (excludeId !== undefined) conditions.push(ne(articles.id, excludeId))

  const rows = await db
    .select({ slug: articles.slug })
    .from(articles)
    .where(and(...conditions))

  return rows.map((row) => row.slug)
}

function buildArticleUpdateValues(input: UpdateArticleInput): ArticleWriteValues {
  const values: ArticleWriteValues = {}

  if (input.title !== undefined) values.title = input.title
  if (input.author !== undefined) values.author = input.author
  if (input.date !== undefined) values.date = input.date
  if (input.excerpt !== undefined) values.excerpt = input.excerpt
  if (input.content !== undefined) values.content = input.content

  return values
}
