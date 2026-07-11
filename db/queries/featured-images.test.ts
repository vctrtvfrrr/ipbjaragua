import { describe, expect, it } from 'vitest'
import { articles, featuredImages } from '@/db/schema'
import { createTestDb } from '@/tests/db'
import { seedArticles } from '@/tests/seed'
import {
  createFeaturedImage,
  deleteFeaturedImage,
  listFeaturedImages,
  pickRandomFeaturedImageId,
} from './featured-images'

describe('featured images', () => {
  it('lists newest images first and picks null from an empty bank', async () => {
    const db = await createTestDb()
    expect(await pickRandomFeaturedImageId(db)).toBeNull()
    await createFeaturedImage('a.webp', db)
    await createFeaturedImage('b.webp', db)
    expect((await listFeaturedImages(db)).map((image) => image.path)).toEqual(['b.webp', 'a.webp'])
  })

  it('clears article links when an image is deleted', async () => {
    const db = await createTestDb()
    const image = await createFeaturedImage('a.webp', db)
    await seedArticles(db, [{ slug: 'artigo', title: 'Artigo', date: '2026-01-01' }])
    await db.update(articles).set({ featured_image_id: image.id })
    await deleteFeaturedImage(image.id, db)
    expect(await db.select().from(featuredImages)).toEqual([])
    expect((await db.select().from(articles))[0]?.featured_image_id).toBeNull()
  })
})
