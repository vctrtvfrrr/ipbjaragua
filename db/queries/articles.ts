import { and, count, desc, eq, getColumns, inArray, isNull, ne, or, sql } from 'drizzle-orm'
import { db as defaultDb, type Database } from '@/db'
import { articles, featuredImages, users } from '@/db/schema'
import { pickRandomFeaturedImageId } from './featured-images'
import { buildSlugCandidates, writeWithAllocatedSlug } from './slug'

export type Article = typeof articles.$inferSelect
export type ArticleWithAuthor = Article & { authorName: string | null; featuredImagePath: string | null }
export type ArticleWithAuthorContact = ArticleWithAuthor & { authorEmail: string }

export type AuthorOption = { id: number; name: string | null; email: string }

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

export class ArticleAuthorNotEligibleError extends Error {
  constructor(authorId: number) {
    super(`User ${authorId} is not eligible to author articles`)
    this.name = 'ArticleAuthorNotEligibleError'
  }
}

export type CreateArticleInput = {
  title: string
  slug: string
  author_id: number
  date: Date
  excerpt: string | null
  content: string
}

export type UpdateArticleInput = {
  title?: string
  slug?: string
  author_id?: number
  date?: Date
  excerpt?: string | null
  content?: string
}

type ArticleWriteValues = Partial<Omit<CreateArticleInput, 'slug'>>

export async function createArticle(input: CreateArticleInput, db: Database = defaultDb): Promise<Article> {
  await assertEligibleAuthor(input.author_id, db)
  const occupiedSlugs = await listOccupiedArticleSlugs(input.slug, db)
  const featuredImageId = await pickRandomFeaturedImageId(db)

  return writeWithAllocatedSlug({
    baseSlug: input.slug,
    occupiedSlugs,
    createCollisionError: (slug) => new ArticleSlugCollisionError(slug),
    tryWrite: async (slug) => {
      const [article] = await db
        .insert(articles)
        .values({ ...input, slug, featured_image_id: featuredImageId })
        .returning()
      return article
    },
  })
}

export async function updateArticle(id: number, input: UpdateArticleInput, db: Database = defaultDb): Promise<Article> {
  const current = await getActiveArticleById(id, db)

  if (input.author_id !== undefined && input.author_id !== current.author_id) {
    await assertEligibleAuthor(input.author_id, db)
  }

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

export async function getArticleById(id: number, db: Database = defaultDb): Promise<Article | undefined> {
  const rows = await db
    .select()
    .from(articles)
    .where(and(eq(articles.id, id), isNull(articles.deleted_at)))
    .limit(1)
  return rows[0]
}

export async function getArticleBySlug(slug: string, db: Database = defaultDb): Promise<ArticleWithAuthor | undefined> {
  const rows = await selectArticlesWithAuthor(db)
    .where(and(eq(articles.slug, slug), isNull(articles.deleted_at)))
    .limit(1)
  return rows[0]
}

export async function listArticles(
  { page, pageSize }: { page: number; pageSize: number },
  db: Database = defaultDb
): Promise<ArticleWithAuthor[]> {
  return selectArticlesWithAuthor(db)
    .where(isNull(articles.deleted_at))
    .orderBy(desc(articles.date), desc(articles.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
}

export async function listArticlesForAdmin(
  { page, pageSize }: { page: number; pageSize: number },
  db: Database = defaultDb
): Promise<ArticleWithAuthorContact[]> {
  return db
    .select({
      ...getColumns(articles),
      authorName: users.name,
      authorEmail: users.email,
      featuredImagePath: featuredImages.path,
    })
    .from(articles)
    .innerJoin(users, eq(articles.author_id, users.id))
    .leftJoin(featuredImages, eq(articles.featured_image_id, featuredImages.id))
    .where(isNull(articles.deleted_at))
    .orderBy(desc(articles.date), desc(articles.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
}

export async function getLatestArticle(db: Database = defaultDb): Promise<ArticleWithAuthor | undefined> {
  const rows = await selectArticlesWithAuthor(db)
    .where(isNull(articles.deleted_at))
    .orderBy(desc(articles.date), desc(articles.id))
    .limit(1)
  return rows[0]
}

export async function countArticles(db: Database = defaultDb): Promise<number> {
  const [row] = await db.select({ value: count() }).from(articles).where(isNull(articles.deleted_at))
  return row?.value ?? 0
}

export async function listAuthorOptions(currentAuthorId?: number, db: Database = defaultDb): Promise<AuthorOption[]> {
  const eligible =
    currentAuthorId === undefined
      ? eq(users.status, 'active')
      : or(eq(users.status, 'active'), eq(users.id, currentAuthorId))

  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eligible)
    .orderBy(users.name)
}

function selectArticlesWithAuthor(db: Database) {
  return db
    .select({ ...getColumns(articles), authorName: users.name, featuredImagePath: featuredImages.path })
    .from(articles)
    .innerJoin(users, eq(articles.author_id, users.id))
    .leftJoin(featuredImages, eq(articles.featured_image_id, featuredImages.id))
}

async function assertEligibleAuthor(authorId: number, db: Database): Promise<void> {
  const [author] = await db.select({ status: users.status }).from(users).where(eq(users.id, authorId)).limit(1)
  if (!author || author.status !== 'active') throw new ArticleAuthorNotEligibleError(authorId)
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
  if (input.author_id !== undefined) values.author_id = input.author_id
  if (input.date !== undefined) values.date = input.date
  if (input.excerpt !== undefined) values.excerpt = input.excerpt
  if (input.content !== undefined) values.content = input.content

  return values
}
