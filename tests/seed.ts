import { eq } from 'drizzle-orm'
import { agenda, announcements, articles, bulletins, liturgies, members, songs, users } from '@/db/schema'
import type { LyricsBlock } from '@/lib/song'
import { parseISODate } from '@/lib/date'
import type { TestDb } from './db'

const toDate = (value: string | null | undefined): Date | null => (value ? parseISODate(value) : null)

export type SeedUser = {
  email: string
  name?: string | null
  status?: 'pending' | 'active' | 'disabled'
}

export async function seedUsers(db: TestDb, rows: SeedUser[]): Promise<number[]> {
  const ids: number[] = []
  for (const row of rows) {
    const [inserted] = await db
      .insert(users)
      .values({ email: row.email, name: row.name ?? null, status: row.status ?? 'active' })
      .returning({ id: users.id })
    ids.push(inserted.id)
  }
  return ids
}

const DEFAULT_AUTHOR_EMAIL = 'autor.seed@example.com'

async function ensureDefaultAuthorId(db: TestDb): Promise<number> {
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, DEFAULT_AUTHOR_EMAIL)).limit(1)
  if (existing) return existing.id

  const [id] = await seedUsers(db, [{ email: DEFAULT_AUTHOR_EMAIL, name: 'Autor Seed', status: 'active' }])
  return id
}

export type SeedArticle = {
  slug: string
  title: string
  author_id?: number
  date: string
  excerpt?: string | null
  content?: string
}

export async function seedArticles(db: TestDb, rows: SeedArticle[]): Promise<number[]> {
  const ids: number[] = []
  for (const row of rows) {
    const author_id = row.author_id ?? (await ensureDefaultAuthorId(db))
    const [inserted] = await db
      .insert(articles)
      .values({
        slug: row.slug,
        title: row.title,
        author_id,
        date: parseISODate(row.date),
        excerpt: row.excerpt ?? null,
        content: row.content ?? '',
      })
      .returning({ id: articles.id })
    ids.push(inserted.id)
  }
  return ids
}

export type SeedSong = {
  slug: string
  title: string
  songwriter?: string | null
  performer?: string | null
  album?: string | null
  track?: number | null
  lyrics?: LyricsBlock[] | null
}

export async function seedSongs(db: TestDb, rows: SeedSong[]): Promise<number[]> {
  const ids: number[] = []
  for (const row of rows) {
    const [inserted] = await db
      .insert(songs)
      .values({
        slug: row.slug,
        title: row.title,
        songwriter: row.songwriter ?? null,
        performer: row.performer ?? null,
        album: row.album ?? null,
        track: row.track ?? null,
        lyrics: row.lyrics ?? [{ type: 'verse', number: 1, content: 'Letra' }],
      })
      .returning({ id: songs.id })
    ids.push(inserted.id)
  }
  return ids
}

export type SeedBulletin = {
  date: string
  edition: number
  title?: string
  article_id?: number | null
  show_announcements?: boolean
  show_agenda?: boolean
  show_birthdays?: boolean
  created_at?: string
}

export type SeedLiturgy = {
  date: string
  theme: string
  time?: string
}

export async function seedLiturgies(db: TestDb, rows: SeedLiturgy[]): Promise<number[]> {
  const ids: number[] = []
  for (const row of rows) {
    const [inserted] = await db
      .insert(liturgies)
      .values({ date: parseISODate(row.date), theme: row.theme, time: row.time ?? '09:00' })
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
      title: row.title ?? 'Boletim Dominical',
      article_id: row.article_id ?? null,
      show_announcements: row.show_announcements ?? true,
      show_agenda: row.show_agenda ?? true,
      show_birthdays: row.show_birthdays ?? true,
      created_at: row.created_at,
    })
  }
}

export type SeedAgendaItem = {
  title: string
  time?: string | null
  event_date: string
  description?: string | null
}

export async function seedAgenda(db: TestDb, rows: SeedAgendaItem[]) {
  for (const row of rows) {
    await db.insert(agenda).values({
      title: row.title,
      time: row.time ?? null,
      event_date: toDate(row.event_date)!,
      description: row.description ?? null,
    })
  }
}

export type SeedAnnouncement = {
  title: string
  expires_at: string
  description?: string
  url?: string | null
}

export async function seedAnnouncements(db: TestDb, rows: SeedAnnouncement[]) {
  for (const row of rows) {
    await db.insert(announcements).values({
      title: row.title,
      expires_at: parseISODate(row.expires_at),
      description: row.description ?? 'Descrição do aviso',
      url: row.url ?? null,
    })
  }
}

export type SeedMember = {
  full_name: string
  status: 'active' | 'transferred' | 'deceased' | 'removed' | 'pending'
  birth_date?: string | null
  sex?: string | null
  wedding_date?: string | null
  spouse?: string | null
  marital_status?: string | null
  prof_faith_year?: number | null
  email?: string | null
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
      marital_status: row.marital_status ?? null,
      prof_faith_year: row.prof_faith_year ?? null,
      email: row.email ?? null,
    })
  }
}
