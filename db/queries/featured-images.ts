import { desc, eq, sql } from 'drizzle-orm'
import { db as defaultDb, type Database } from '@/db'
import { featuredImages } from '@/db/schema'

export type FeaturedImage = typeof featuredImages.$inferSelect

export async function listFeaturedImages(db: Database = defaultDb): Promise<FeaturedImage[]> {
  return db.select().from(featuredImages).orderBy(desc(featuredImages.id))
}

export async function getFeaturedImageById(id: number, db: Database = defaultDb): Promise<FeaturedImage | undefined> {
  const [image] = await db.select().from(featuredImages).where(eq(featuredImages.id, id)).limit(1)
  return image
}

export async function createFeaturedImage(path: string, db: Database = defaultDb): Promise<FeaturedImage> {
  const [image] = await db.insert(featuredImages).values({ path }).returning()
  return image
}

export async function deleteFeaturedImage(id: number, db: Database = defaultDb): Promise<FeaturedImage> {
  const [image] = await db.delete(featuredImages).where(eq(featuredImages.id, id)).returning()
  if (!image) throw new Error('Featured image not found')
  return image
}

export async function pickRandomFeaturedImageId(db: Database = defaultDb): Promise<number | null> {
  const [image] = await db
    .select({ id: featuredImages.id })
    .from(featuredImages)
    .orderBy(sql`random()`)
    .limit(1)
  return image?.id ?? null
}
