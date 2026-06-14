import { agenda, announcements, articles, bulletins, liturgies, members } from '@/db/schema'
import type { TestDb } from './db'

export type SeedArticle = {
  slug: string
  title: string
  author?: string | null
  date: string
  excerpt?: string | null
  content?: string
}

export function seedArticles(db: TestDb, rows: SeedArticle[]): number[] {
  return rows.map((row) => {
    const result = db
      .insert(articles)
      .values({
        slug: row.slug,
        title: row.title,
        author: row.author ?? null,
        date: row.date,
        excerpt: row.excerpt ?? null,
        content: row.content ?? '',
      })
      .run()
    return Number(result.lastInsertRowid)
  })
}

export type SeedBulletin = {
  date: string
  edition: number
  title?: string | null
  article_id?: number | null
  show_announcements?: boolean
  show_agenda?: boolean
  show_birthdays?: boolean
  agenda_from?: string
  agenda_to?: string
  birthdays_from?: string
  birthdays_to?: string
}

export type SeedLiturgy = {
  date: string
  theme: string
  time?: string | null
}

export function seedLiturgies(db: TestDb, rows: SeedLiturgy[]): number[] {
  return rows.map((row) => {
    const result = db
      .insert(liturgies)
      .values({ date: row.date, theme: row.theme, time: row.time ?? null })
      .run()
    return Number(result.lastInsertRowid)
  })
}

export function seedBulletins(db: TestDb, rows: SeedBulletin[]) {
  for (const row of rows) {
    db.insert(bulletins)
      .values({
        date: row.date,
        edition: row.edition,
        title: row.title ?? null,
        article_id: row.article_id ?? null,
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

export type SeedAgendaItem = {
  title: string
  is_recurring: boolean
  weekday?: number | null
  time?: string | null
  event_date?: string | null
  description?: string | null
}

export function seedAgenda(db: TestDb, rows: SeedAgendaItem[]) {
  for (const row of rows) {
    db.insert(agenda)
      .values({
        title: row.title,
        is_recurring: row.is_recurring,
        weekday: row.weekday ?? null,
        time: row.time ?? null,
        event_date: row.event_date ?? null,
        description: row.description ?? null,
      })
      .run()
  }
}

export type SeedAnnouncement = {
  title: string
  expires_at: string
  description?: string | null
  url?: string | null
}

export function seedAnnouncements(db: TestDb, rows: SeedAnnouncement[]) {
  for (const row of rows) {
    db.insert(announcements)
      .values({
        title: row.title,
        expires_at: row.expires_at,
        description: row.description ?? null,
        url: row.url ?? null,
      })
      .run()
  }
}

export type SeedMember = {
  full_name: string
  status: 'active' | 'transferred' | 'deceased' | 'removed'
  birth_date?: string | null
  sex?: string | null
  wedding_date?: string | null
  spouse?: string | null
}

export function seedMembers(db: TestDb, rows: SeedMember[]) {
  for (const row of rows) {
    db.insert(members)
      .values({
        full_name: row.full_name,
        status: row.status,
        birth_date: row.birth_date ?? null,
        sex: row.sex ?? null,
        wedding_date: row.wedding_date ?? null,
        spouse: row.spouse ?? null,
      })
      .run()
  }
}
