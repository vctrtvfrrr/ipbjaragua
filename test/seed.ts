import { agenda, announcements, articles, bulletins, liturgies, members } from '@/db/schema'
import { parseISODate } from '@/lib/date'
import type { TestDb } from './db'

const toDate = (value: string | null | undefined): Date | null => (value ? parseISODate(value) : null)

export type SeedArticle = {
  slug: string
  title: string
  author?: string | null
  date: string
  excerpt?: string | null
  content?: string
}

export async function seedArticles(db: TestDb, rows: SeedArticle[]): Promise<number[]> {
  const ids: number[] = []
  for (const row of rows) {
    const [inserted] = await db
      .insert(articles)
      .values({
        slug: row.slug,
        title: row.title,
        author: row.author ?? null,
        date: parseISODate(row.date),
        excerpt: row.excerpt ?? null,
        content: row.content ?? '',
      })
      .returning({ id: articles.id })
    ids.push(inserted.id)
  }
  return ids
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

export async function seedLiturgies(db: TestDb, rows: SeedLiturgy[]): Promise<number[]> {
  const ids: number[] = []
  for (const row of rows) {
    const [inserted] = await db
      .insert(liturgies)
      .values({ date: parseISODate(row.date), theme: row.theme, time: row.time ?? null })
      .returning({ id: liturgies.id })
    ids.push(inserted.id)
  }
  return ids
}

export async function seedBulletins(db: TestDb, rows: SeedBulletin[]) {
  for (const row of rows) {
    await db.insert(bulletins).values({
      date: parseISODate(row.date),
      edition: row.edition,
      title: row.title ?? null,
      article_id: row.article_id ?? null,
      show_announcements: row.show_announcements ?? true,
      show_agenda: row.show_agenda ?? true,
      show_birthdays: row.show_birthdays ?? true,
      agenda_from: parseISODate(row.agenda_from ?? row.date),
      agenda_to: parseISODate(row.agenda_to ?? row.date),
      birthdays_from: parseISODate(row.birthdays_from ?? row.date),
      birthdays_to: parseISODate(row.birthdays_to ?? row.date),
    })
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

export async function seedAgenda(db: TestDb, rows: SeedAgendaItem[]) {
  for (const row of rows) {
    await db.insert(agenda).values({
      title: row.title,
      is_recurring: row.is_recurring,
      weekday: row.weekday ?? null,
      time: row.time ?? null,
      event_date: toDate(row.event_date),
      description: row.description ?? null,
    })
  }
}

export type SeedAnnouncement = {
  title: string
  expires_at: string
  description?: string | null
  url?: string | null
}

export async function seedAnnouncements(db: TestDb, rows: SeedAnnouncement[]) {
  for (const row of rows) {
    await db.insert(announcements).values({
      title: row.title,
      expires_at: parseISODate(row.expires_at),
      description: row.description ?? null,
      url: row.url ?? null,
    })
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

export async function seedMembers(db: TestDb, rows: SeedMember[]) {
  for (const row of rows) {
    await db.insert(members).values({
      full_name: row.full_name,
      status: row.status,
      birth_date: toDate(row.birth_date),
      sex: row.sex ?? null,
      wedding_date: toDate(row.wedding_date),
      spouse: row.spouse ?? null,
    })
  }
}
