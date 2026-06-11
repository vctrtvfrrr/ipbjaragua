import { articles } from '@/db/schema'
import type { TestDb } from './db'

export type SeedArticle = {
  slug: string
  title: string
  author?: string | null
  date: string
  excerpt?: string | null
  content?: string
}

export function seedArticles(db: TestDb, rows: SeedArticle[]) {
  for (const row of rows) {
    db.insert(articles)
      .values({
        slug: row.slug,
        title: row.title,
        author: row.author ?? null,
        date: row.date,
        excerpt: row.excerpt ?? null,
        content: row.content ?? '',
      })
      .run()
  }
}
