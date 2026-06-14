import { and, asc, count, desc, eq, isNull, lte } from 'drizzle-orm'
import { db as defaultDb } from '@/db'
import { liturgyActs, liturgyMoments, liturgies, songs } from '@/db/schema'
import { liturgySlug } from '@/lib/bulletin'
import { songReference } from '@/lib/song'

export type Liturgy = typeof liturgies.$inferSelect

type Database = typeof defaultDb

export type LiturgyListItem = {
  id: number
  date: string
  theme: string
  time: string | null
  sermonDescription: string | null
  sermonSpeaker: string | null
}

export type LiturgyDetail = {
  id: number
  date: string
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
      scripture_passages: string | null
      song: { title: string; songReference: string | null; lyrics: string | null } | null
    }>
  }>
}

export async function countLiturgies({ today }: { today: string }, db: Database = defaultDb): Promise<number> {
  const row = db
    .select({ value: count() })
    .from(liturgies)
    .where(and(isNull(liturgies.deleted_at), lte(liturgies.date, today)))
    .get()
  return row?.value ?? 0
}

export async function listLiturgies(
  { page, pageSize, today }: { page: number; pageSize: number; today: string },
  db: Database = defaultDb
): Promise<LiturgyListItem[]> {
  const rows = db
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
    .all()

  const seen = new Set<number>()
  const result: LiturgyListItem[] = []
  for (const row of rows) {
    if (!seen.has(row.id)) {
      seen.add(row.id)
      result.push({
        id: row.id,
        date: row.date,
        theme: row.theme,
        time: row.time ?? null,
        sermonDescription: row.sermonDescription ?? null,
        sermonSpeaker: row.sermonSpeaker ?? null,
      })
    }
  }
  return result
}

export async function listLiturgiesByDate(
  date: string,
  db: Database = defaultDb
): Promise<Array<{ id: number; date: string; theme: string; time: string | null }>> {
  return db
    .select({ id: liturgies.id, date: liturgies.date, theme: liturgies.theme, time: liturgies.time })
    .from(liturgies)
    .where(and(isNull(liturgies.deleted_at), eq(liturgies.date, date)))
    .all()
    .map((r) => ({ ...r, time: r.time ?? null }))
}

export async function getLiturgyBySlug(
  slug: string,
  today: string,
  db: Database = defaultDb
): Promise<LiturgyDetail | undefined> {
  const date = slug.slice(0, 10)
  if (date > today) return undefined

  const candidates = db
    .select()
    .from(liturgies)
    .where(and(isNull(liturgies.deleted_at), eq(liturgies.date, date), lte(liturgies.date, today)))
    .all()

  const liturgy = candidates.find((l) => liturgySlug(l.date, l.theme, l.time) === slug)
  if (!liturgy) return undefined

  const rows = db
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
    .all()

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
    time: liturgy.time ?? null,
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
    date: string
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
        time: row.time ?? null,
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
  { today, currentTime }: { today: string; currentTime: string },
  db: Database = defaultDb
): Promise<NextLiturgyResult | undefined> {
  const todayRows = db
    .select(liturgyCardFields)
    .from(liturgies)
    .leftJoin(liturgyActs, eq(liturgyActs.liturgy_id, liturgies.id))
    .leftJoin(liturgyMoments, and(eq(liturgyMoments.act_id, liturgyActs.id), eq(liturgyMoments.type, 'sermon')))
    .where(and(isNull(liturgies.deleted_at), eq(liturgies.date, today)))
    .orderBy(asc(liturgies.time))
    .all()

  const todayLiturgies = deduplicateByLiturgyId(todayRows)
  const upcoming = todayLiturgies.find((l) => l.time !== null && currentTime <= addMinutesToHHMM(l.time, 60))
  if (upcoming) return { liturgy: upcoming, label: 'Próxima Liturgia' }

  const fallbackRows = db
    .select(liturgyCardFields)
    .from(liturgies)
    .leftJoin(liturgyActs, eq(liturgyActs.liturgy_id, liturgies.id))
    .leftJoin(liturgyMoments, and(eq(liturgyMoments.act_id, liturgyActs.id), eq(liturgyMoments.type, 'sermon')))
    .where(and(isNull(liturgies.deleted_at), lte(liturgies.date, today)))
    .orderBy(desc(liturgies.date))
    .limit(20)
    .all()

  const fallback = deduplicateByLiturgyId(fallbackRows)[0]
  return fallback ? { liturgy: fallback, label: 'Liturgia' } : undefined
}
