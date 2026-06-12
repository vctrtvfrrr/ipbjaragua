import { articles, bulletins } from '@/db/schema'
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

export type SeedBulletin = {
  date: string
  edition: number
  title?: string | null
  article_id?: number | null
  liturgy_id?: number | null
  show_announcements?: boolean
  show_agenda?: boolean
  show_birthdays?: boolean
  agenda_from?: string
  agenda_to?: string
  birthdays_from?: string
  birthdays_to?: string
}

export function seedBulletins(db: TestDb, rows: SeedBulletin[]) {
  for (const row of rows) {
    db.insert(bulletins)
      .values({
        date: row.date,
        edition: row.edition,
        title: row.title ?? null,
        article_id: row.article_id ?? null,
        liturgy_id: row.liturgy_id ?? null,
        show_announcements: row.show_announcements ?? true,
        show_agenda: row.show_agenda ?? true,
        show_birthdays: row.show_birthdays ?? true,
        agenda_from: row.agenda_from ?? row.date,
        agenda_to: row.agenda_to ?? row.date,
        birthdays_from: row.birthdays_from ?? row.date,
        birthdays_to: row.birthdays_to ?? row.date,
      })
      .run()
  }
}
