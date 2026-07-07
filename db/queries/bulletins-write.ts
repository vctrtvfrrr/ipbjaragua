import { and, count, desc, eq, getTableColumns, isNull, max } from 'drizzle-orm'
import { db as defaultDb, type Database } from '@/db'
import { articles, bulletins, users } from '@/db/schema'

export type Bulletin = typeof bulletins.$inferSelect
export type BulletinArticleOption = { id: number; title: string; authorName: string | null }
export type BulletinForAdmin = Bulletin & { articleTitle: string | null }

export class BulletinNotFoundError extends Error {
  constructor(id: number) {
    super(`Bulletin ${id} was not found`)
    this.name = 'BulletinNotFoundError'
  }
}

export class BulletinArticleNotEligibleError extends Error {
  constructor(articleId: number) {
    super(`Article ${articleId} is not eligible for bulletins`)
    this.name = 'BulletinArticleNotEligibleError'
  }
}

export class BulletinCorrectionWindowError extends Error {
  constructor() {
    super('Bulletin date/delete is outside the correction window')
    this.name = 'BulletinCorrectionWindowError'
  }
}

export class BulletinUniqueConstraintError extends Error {
  constructor(readonly field: 'date' | 'edition') {
    super(`Bulletin ${field} must be unique`)
    this.name = 'BulletinUniqueConstraintError'
  }
}

export type CreateBulletinInput = {
  title: string
  date: Date
  edition: number
  article_id: number | null
  show_announcements: boolean
  show_agenda: boolean
  show_birthdays: boolean
}

export type UpdateBulletinInput = CreateBulletinInput

export async function createBulletin(input: CreateBulletinInput, db: Database = defaultDb): Promise<Bulletin> {
  await assertEligibleArticle(input.article_id, db)

  try {
    const [bulletin] = await db.insert(bulletins).values(input).returning()
    return bulletin
  } catch (error) {
    throw translateBulletinWriteError(error)
  }
}

export async function updateBulletin(
  id: number,
  input: UpdateBulletinInput,
  options: { today: Date; now: Date },
  db: Database = defaultDb
): Promise<Bulletin> {
  const current = await getBulletinById(id, db)
  if (!current) throw new BulletinNotFoundError(id)

  if (input.date.getTime() !== current.date.getTime() && !isBulletinInCorrectionWindow(current, options)) {
    throw new BulletinCorrectionWindowError()
  }

  await assertEligibleArticle(input.article_id, db)

  try {
    const [bulletin] = await db.update(bulletins).set(input).where(eq(bulletins.id, id)).returning()
    if (!bulletin) throw new BulletinNotFoundError(id)
    return bulletin
  } catch (error) {
    throw translateBulletinWriteError(error)
  }
}

export async function deleteBulletin(
  id: number,
  options: { today: Date; now: Date },
  db: Database = defaultDb
): Promise<Bulletin> {
  const current = await getBulletinById(id, db)
  if (!current) throw new BulletinNotFoundError(id)
  if (!isBulletinInCorrectionWindow(current, options)) throw new BulletinCorrectionWindowError()

  const [bulletin] = await db.delete(bulletins).where(eq(bulletins.id, id)).returning()
  if (!bulletin) throw new BulletinNotFoundError(id)
  return bulletin
}

export async function getBulletinById(id: number, db: Database = defaultDb): Promise<Bulletin | undefined> {
  const rows = await db.select().from(bulletins).where(eq(bulletins.id, id)).limit(1)
  return rows[0]
}

export async function listBulletinsForAdmin(
  { page, pageSize }: { page: number; pageSize: number },
  db: Database = defaultDb
): Promise<BulletinForAdmin[]> {
  return db
    .select({ ...getTableColumns(bulletins), articleTitle: articles.title })
    .from(bulletins)
    .leftJoin(articles, eq(bulletins.article_id, articles.id))
    .orderBy(desc(bulletins.date), desc(bulletins.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
}

export async function countBulletinsForAdmin(db: Database = defaultDb): Promise<number> {
  const [row] = await db.select({ value: count() }).from(bulletins)
  return row?.value ?? 0
}

export async function nextBulletinEdition(db: Database = defaultDb): Promise<number> {
  const [row] = await db.select({ value: max(bulletins.edition) }).from(bulletins)
  return (row?.value ?? 0) + 1
}

export async function listBulletinArticleOptions(db: Database = defaultDb): Promise<BulletinArticleOption[]> {
  return db
    .select({ id: articles.id, title: articles.title, authorName: users.name })
    .from(articles)
    .leftJoin(users, eq(articles.author_id, users.id))
    .where(isNull(articles.deleted_at))
    .orderBy(desc(articles.date), desc(articles.id))
}

export function isBulletinInCorrectionWindow(
  bulletin: Pick<Bulletin, 'date' | 'created_at'>,
  { today, now }: { today: Date; now: Date }
): boolean {
  if (bulletin.date > today) return true

  const createdAt = new Date(bulletin.created_at)
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7)
  return createdAt >= sevenDaysAgo
}

async function assertEligibleArticle(articleId: number | null, db: Database): Promise<void> {
  if (articleId === null) return

  const [article] = await db
    .select({ id: articles.id })
    .from(articles)
    .where(and(eq(articles.id, articleId), isNull(articles.deleted_at)))
    .limit(1)

  if (!article) throw new BulletinArticleNotEligibleError(articleId)
}

function translateBulletinWriteError(error: unknown): unknown {
  const messages = errorChain(error).map((item) => (item instanceof Error ? item.message : ''))
  const constraints = errorChain(error).map((item) =>
    typeof item === 'object' && item !== null && 'constraint' in item ? item.constraint : undefined
  )

  if (
    constraints.includes('bulletins_date_unique') ||
    messages.some((message) => message.includes('bulletins_date_unique'))
  ) {
    return new BulletinUniqueConstraintError('date')
  }

  if (
    constraints.includes('bulletins_edition_unique') ||
    messages.some((message) => message.includes('bulletins_edition_unique'))
  ) {
    return new BulletinUniqueConstraintError('edition')
  }

  return error
}

function errorChain(error: unknown): unknown[] {
  const chain: unknown[] = []
  let current = error

  while (current && chain.length < 5) {
    chain.push(current)
    current = typeof current === 'object' && 'cause' in current ? current.cause : undefined
  }

  return chain
}
