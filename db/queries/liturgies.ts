import { and, asc, count, desc, eq, isNull, lte } from 'drizzle-orm'
import { db as defaultDb, type Database } from '@/db'
import { liturgyActs, liturgyMoments, liturgies, type ScripturePassage, songs } from '@/db/schema'
import { liturgySlug } from '@/lib/bulletin'
import { parseISODate } from '@/lib/date'
import { type LyricsBlock, songReference } from '@/lib/song'

export type Liturgy = typeof liturgies.$inferSelect

function hhmm(time: string | null): string | null {
  return time ? time.slice(0, 5) : null
}

export type LiturgyListItem = {
  id: number
  date: Date
  theme: string
  time: string | null
  sermonDescription: string | null
  sermonSpeaker: string | null
}

export type LiturgyDetail = {
  id: number
  date: Date
  theme: string
  time: string | null
  acts: Array<{
    id: number
    position: number
    name: string
    moments: Array<{
      id: number
      position: number
      type: 'bible_reading' | 'song' | 'prayer' | 'sermon' | 'sacrament' | 'pastoral_act' | 'other'
      description: string | null
      sermon_speaker: string | null
      sacrament_type: 'baptism' | 'eucharist' | null
      scripture_passages: ScripturePassage[] | null
      song: { title: string; songReference: string | null; lyrics: LyricsBlock[] | null } | null
    }>
  }>
}

export async function countLiturgies({ today }: { today: Date }, db: Database = defaultDb): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(liturgies)
    .where(and(isNull(liturgies.deleted_at), lte(liturgies.date, today)))
  return row?.value ?? 0
}

export async function listLiturgies(
  { page, pageSize, today }: { page: number; pageSize: number; today: Date },
  db: Database = defaultDb
): Promise<LiturgyListItem[]> {
  const rows = await db
    .select({
      id: liturgies.id,
      date: liturgies.date,
      theme: liturgies.theme,
      time: liturgies.time,
      sermonDescription: liturgyMoments.description,
      sermonSpeaker: liturgyMoments.sermon_speaker,
    })
    .from(liturgies)
    .leftJoin(liturgyActs, eq(liturgyActs.liturgy_id, liturgies.id))
    .leftJoin(liturgyMoments, and(eq(liturgyMoments.act_id, liturgyActs.id), eq(liturgyMoments.type, 'sermon')))
    .where(and(isNull(liturgies.deleted_at), lte(liturgies.date, today)))
    .orderBy(desc(liturgies.date))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  const seen = new Set<number>()
  const result: LiturgyListItem[] = []
  for (const row of rows) {
    if (!seen.has(row.id)) {
      seen.add(row.id)
      result.push({
        id: row.id,
        date: row.date,
        theme: row.theme,
        time: hhmm(row.time),
        sermonDescription: row.sermonDescription ?? null,
        sermonSpeaker: row.sermonSpeaker ?? null,
      })
    }
  }
  return result
}

export async function listLiturgiesByDate(
  date: Date,
  db: Database = defaultDb
): Promise<Array<{ id: number; date: Date; theme: string; time: string | null }>> {
  const rows = await db
    .select({ id: liturgies.id, date: liturgies.date, theme: liturgies.theme, time: liturgies.time })
    .from(liturgies)
    .where(and(isNull(liturgies.deleted_at), eq(liturgies.date, date)))
  return rows.map((r) => ({ ...r, time: hhmm(r.time) }))
}

export async function getLiturgyBySlug(
  slug: string,
  today: Date,
  db: Database = defaultDb
): Promise<LiturgyDetail | undefined> {
  const date = parseISODate(slug.slice(0, 10))
  if (date > today) return undefined

  const candidates = await db
    .select()
    .from(liturgies)
    .where(and(isNull(liturgies.deleted_at), eq(liturgies.date, date), lte(liturgies.date, today)))

  const liturgy = candidates.find((l) => liturgySlug(l.date, l.theme, l.time) === slug)
  if (!liturgy) return undefined

  const rows = await db
    .select({
      act: liturgyActs,
      moment: liturgyMoments,
      song: songs,
    })
    .from(liturgyActs)
    .leftJoin(liturgyMoments, eq(liturgyMoments.act_id, liturgyActs.id))
    .leftJoin(songs, eq(songs.id, liturgyMoments.song_id))
    .where(eq(liturgyActs.liturgy_id, liturgy.id))
    .orderBy(asc(liturgyActs.position), asc(liturgyMoments.position))

  const actsMap = new Map<
    number,
    { id: number; position: number; name: string; moments: LiturgyDetail['acts'][0]['moments'] }
  >()

  for (const row of rows) {
    if (!actsMap.has(row.act.id)) {
      actsMap.set(row.act.id, {
        id: row.act.id,
        position: row.act.position,
        name: row.act.name,
        moments: [],
      })
    }

    if (row.moment) {
      const act = actsMap.get(row.act.id)!
      act.moments.push({
        id: row.moment.id,
        position: row.moment.position,
        type: row.moment.type,
        description: row.moment.description ?? null,
        sermon_speaker: row.moment.sermon_speaker ?? null,
        sacrament_type: row.moment.sacrament_type ?? null,
        scripture_passages: row.moment.scripture_passages ?? null,
        song: row.song
          ? {
              title: row.song.title,
              lyrics: row.song.lyrics ?? null,
              songReference: songReference({
                track: row.song.track ?? null,
                album: row.song.album ?? null,
                performer: row.song.performer ?? null,
                songwriter: row.song.songwriter ?? null,
              }),
            }
          : null,
      })
    }
  }

  return {
    id: liturgy.id,
    date: liturgy.date,
    theme: liturgy.theme,
    time: hhmm(liturgy.time),
    acts: Array.from(actsMap.values()),
  }
}

function addMinutesToHHMM(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = Math.min(h * 60 + m + minutes, 23 * 60 + 59)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function deduplicateByLiturgyId(
  rows: Array<{
    id: number
    date: Date
    theme: string
    time: string | null
    sermonDescription: string | null
    sermonSpeaker: string | null
  }>
): LiturgyListItem[] {
  const seen = new Set<number>()
  const result: LiturgyListItem[] = []
  for (const row of rows) {
    if (!seen.has(row.id)) {
      seen.add(row.id)
      result.push({
        id: row.id,
        date: row.date,
        theme: row.theme,
        time: hhmm(row.time),
        sermonDescription: row.sermonDescription ?? null,
        sermonSpeaker: row.sermonSpeaker ?? null,
      })
    }
  }
  return result
}

const liturgyCardFields = {
  id: liturgies.id,
  date: liturgies.date,
  theme: liturgies.theme,
  time: liturgies.time,
  sermonDescription: liturgyMoments.description,
  sermonSpeaker: liturgyMoments.sermon_speaker,
} as const

export type NextLiturgyResult = { liturgy: LiturgyListItem; label: 'Próxima Liturgia' | 'Liturgia' }

export async function getNextLiturgy(
  { today, currentTime }: { today: Date; currentTime: string },
  db: Database = defaultDb
): Promise<NextLiturgyResult | undefined> {
  const todayRows = await db
    .select(liturgyCardFields)
    .from(liturgies)
    .leftJoin(liturgyActs, eq(liturgyActs.liturgy_id, liturgies.id))
    .leftJoin(liturgyMoments, and(eq(liturgyMoments.act_id, liturgyActs.id), eq(liturgyMoments.type, 'sermon')))
    .where(and(isNull(liturgies.deleted_at), eq(liturgies.date, today)))
    .orderBy(asc(liturgies.time))

  const todayLiturgies = deduplicateByLiturgyId(todayRows)
  const upcoming = todayLiturgies.find((l) => l.time !== null && currentTime <= addMinutesToHHMM(l.time, 60))
  if (upcoming) return { liturgy: upcoming, label: 'Próxima Liturgia' }

  const fallbackRows = await db
    .select(liturgyCardFields)
    .from(liturgies)
    .leftJoin(liturgyActs, eq(liturgyActs.liturgy_id, liturgies.id))
    .leftJoin(liturgyMoments, and(eq(liturgyMoments.act_id, liturgyActs.id), eq(liturgyMoments.type, 'sermon')))
    .where(and(isNull(liturgies.deleted_at), lte(liturgies.date, today)))
    .orderBy(desc(liturgies.date))
    .limit(20)

  const fallback = deduplicateByLiturgyId(fallbackRows)[0]
  return fallback ? { liturgy: fallback, label: 'Liturgia' } : undefined
}
