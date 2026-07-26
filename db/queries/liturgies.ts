import { and, asc, count, desc, eq, getTableColumns, gt, gte, inArray, isNull, lte, sql } from 'drizzle-orm'
import { db as defaultDb, type Database } from '@/db'
import { liturgyActs, liturgyMoments, liturgies, type LiturgyStatus, type ScripturePassage, songs } from '@/db/schema'
import { liturgySlug } from '@/lib/bulletin'
import { parseISODate } from '@/lib/date'
import { normalizeMomentForType, type LiturgyTreeInput, type LiturgyTreeUpdateInput } from '@/lib/liturgy'
import type { LiturgyVisibility } from '@/lib/liturgy-visibility'
import { type LyricsBlock, songReference } from '@/lib/song'

export type Liturgy = typeof liturgies.$inferSelect

function hhmm(time: string | null): string | null {
  return time ? time.slice(0, 5) : null
}

export type LiturgyListItem = {
  id: number
  date: Date
  theme: string
  time: string
  status: LiturgyStatus
  description: string | null
  sermonDescription: string | null
  sermonSpeaker: string | null
}

function visibleLiturgy(visibility: LiturgyVisibility) {
  return visibility === 'include-drafts' ? undefined : eq(liturgies.status, 'published')
}

export type LiturgyDetail = {
  id: number
  date: Date
  theme: string
  time: string
  status: LiturgyStatus
  description: string | null
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

export type LiturgyForAdmin = {
  id: number
  date: Date
  theme: string
  time: string
  status: LiturgyStatus
  actsCount: number
}

export type LiturgyEditorData = {
  id: number
  date: Date
  theme: string
  time: string
  status: LiturgyStatus
  description: string | null
  acts: Array<{
    id: number
    name: string
    moments: Array<{
      id: number
      type: LiturgyDetail['acts'][number]['moments'][number]['type']
      description: string | null
      song_id: number | null
      scripture_passages: ScripturePassage[] | null
      sermon_speaker: string | null
      sacrament_type: 'baptism' | 'eucharist' | null
    }>
  }>
}

export type SongPickerOption = { id: number; title: string; songReference: string | null }

export class LiturgyNotFoundError extends Error {
  constructor(id: number) {
    super(`Liturgy ${id} was not found`)
    this.name = 'LiturgyNotFoundError'
  }
}

export class LiturgyTreeScopeError extends Error {
  constructor() {
    super('Liturgy tree contains ids outside the edited liturgy')
    this.name = 'LiturgyTreeScopeError'
  }
}

export async function countLiturgies(
  { visibility }: { visibility: LiturgyVisibility },
  db: Database = defaultDb
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(liturgies)
    .where(and(isNull(liturgies.deleted_at), visibleLiturgy(visibility)))
  return row?.value ?? 0
}

/** Locates the upcoming/past seam across the whole date-desc sequence, so a listing can mark it
 * without both sides of the seam landing on the same page. */
export async function countFutureOrTodayLiturgies(
  { visibility, fromDate }: { visibility: LiturgyVisibility; fromDate: Date },
  db: Database = defaultDb
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(liturgies)
    .where(and(isNull(liturgies.deleted_at), gte(liturgies.date, fromDate), visibleLiturgy(visibility)))
  return row?.value ?? 0
}

export async function listLiturgies(
  { page, pageSize, visibility }: { page: number; pageSize: number; visibility: LiturgyVisibility },
  db: Database = defaultDb
): Promise<LiturgyListItem[]> {
  const rows = await db
    .select(liturgyCardColumns)
    .from(liturgies)
    .where(and(isNull(liturgies.deleted_at), visibleLiturgy(visibility)))
    .orderBy(desc(liturgies.date))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  return withSermons(rows, db)
}

export async function listLiturgiesByDate(
  date: Date,
  visibility: LiturgyVisibility,
  db: Database = defaultDb
): Promise<Array<{ id: number; date: Date; theme: string; time: string; status: LiturgyStatus }>> {
  const rows = await db
    .select({
      id: liturgies.id,
      date: liturgies.date,
      theme: liturgies.theme,
      time: liturgies.time,
      status: liturgies.status,
    })
    .from(liturgies)
    .where(and(isNull(liturgies.deleted_at), eq(liturgies.date, date), visibleLiturgy(visibility)))
  return rows.map((r) => ({ ...r, time: hhmm(r.time)! }))
}

export async function countLiturgiesForAdmin(db: Database = defaultDb): Promise<number> {
  const [row] = await db.select({ value: count() }).from(liturgies).where(isNull(liturgies.deleted_at))
  return row?.value ?? 0
}

export async function listLiturgiesForAdmin(
  { page, pageSize }: { page: number; pageSize: number },
  db: Database = defaultDb
): Promise<LiturgyForAdmin[]> {
  const rows = await db
    .select({
      ...getTableColumns(liturgies),
      actsCount: count(liturgyActs.id),
    })
    .from(liturgies)
    .leftJoin(liturgyActs, eq(liturgyActs.liturgy_id, liturgies.id))
    .where(isNull(liturgies.deleted_at))
    .groupBy(liturgies.id)
    .orderBy(desc(liturgies.date), asc(liturgies.time), desc(liturgies.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  return rows.map((row) => ({ ...row, time: hhmm(row.time)! }))
}

export async function getLiturgyForEditor(
  id: number,
  db: Database = defaultDb
): Promise<LiturgyEditorData | undefined> {
  const [liturgy] = await db
    .select()
    .from(liturgies)
    .where(and(eq(liturgies.id, id), isNull(liturgies.deleted_at)))
    .limit(1)
  if (!liturgy) return undefined

  const rows = await db
    .select({ act: liturgyActs, moment: liturgyMoments })
    .from(liturgyActs)
    .leftJoin(liturgyMoments, eq(liturgyMoments.act_id, liturgyActs.id))
    .where(eq(liturgyActs.liturgy_id, id))
    .orderBy(asc(liturgyActs.position), asc(liturgyMoments.position))

  const acts = new Map<number, LiturgyEditorData['acts'][number]>()
  for (const row of rows) {
    if (!acts.has(row.act.id)) {
      acts.set(row.act.id, { id: row.act.id, name: row.act.name, moments: [] })
    }

    if (row.moment) {
      acts.get(row.act.id)!.moments.push({
        id: row.moment.id,
        type: row.moment.type,
        description: row.moment.description ?? null,
        song_id: row.moment.song_id ?? null,
        scripture_passages: row.moment.scripture_passages ?? null,
        sermon_speaker: row.moment.sermon_speaker ?? null,
        sacrament_type: row.moment.sacrament_type ?? null,
      })
    }
  }

  return {
    id: liturgy.id,
    date: liturgy.date,
    theme: liturgy.theme,
    time: hhmm(liturgy.time)!,
    status: liturgy.status,
    description: liturgy.description ?? null,
    acts: Array.from(acts.values()),
  }
}

export async function listSongPickerOptions(db: Database = defaultDb): Promise<SongPickerOption[]> {
  const rows = await db
    .select(getTableColumns(songs))
    .from(songs)
    .where(isNull(songs.deleted_at))
    .orderBy(asc(songs.title), asc(songs.id))

  return rows.map((song) => ({ id: song.id, title: song.title, songReference: songReference(song) }))
}

export async function createLiturgyTree(input: LiturgyTreeInput, db: Database = defaultDb): Promise<Liturgy> {
  return db.transaction(async (tx) => {
    const [liturgy] = await tx
      .insert(liturgies)
      .values({
        date: input.date,
        theme: input.theme,
        time: input.time,
        description: input.description,
        status: input.status,
      })
      .returning()

    await writeActsAndMoments(liturgy.id, input.acts, tx as Database)
    return liturgy
  })
}

export async function updateLiturgyTree(
  id: number,
  input: LiturgyTreeUpdateInput,
  db: Database = defaultDb
): Promise<Liturgy> {
  return db.transaction(async (tx) => {
    await assertActiveLiturgy(id, tx as Database)
    await assertTreeScope(id, input, tx as Database)

    const [liturgy] = await tx
      .update(liturgies)
      .set({
        date: input.date,
        theme: input.theme,
        time: input.time,
        description: input.description,
        ...(input.status ? { status: input.status } : {}),
      })
      .where(and(eq(liturgies.id, id), isNull(liturgies.deleted_at)))
      .returning()
    if (!liturgy) throw new LiturgyNotFoundError(id)

    await reconcileActsAndMoments(id, input.acts, tx as Database)
    return liturgy
  })
}

export async function softDeleteLiturgy(id: number, db: Database = defaultDb): Promise<Liturgy> {
  const [liturgy] = await db
    .update(liturgies)
    .set({ deleted_at: sql`CURRENT_TIMESTAMP` })
    .where(and(eq(liturgies.id, id), isNull(liturgies.deleted_at)))
    .returning()

  if (!liturgy) throw new LiturgyNotFoundError(id)
  return liturgy
}

export async function setLiturgyStatus(id: number, status: LiturgyStatus, db: Database = defaultDb): Promise<Liturgy> {
  const [liturgy] = await db
    .update(liturgies)
    .set({ status })
    .where(and(eq(liturgies.id, id), isNull(liturgies.deleted_at)))
    .returning()

  if (!liturgy) throw new LiturgyNotFoundError(id)
  return liturgy
}

export async function getLiturgyBySlug(
  slug: string,
  visibility: LiturgyVisibility,
  db: Database = defaultDb
): Promise<LiturgyDetail | undefined> {
  const date = parseISODate(slug.slice(0, 10))

  const candidates = await db
    .select()
    .from(liturgies)
    .where(and(isNull(liturgies.deleted_at), eq(liturgies.date, date), visibleLiturgy(visibility)))

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
    time: hhmm(liturgy.time)!,
    status: liturgy.status,
    description: liturgy.description ?? null,
    acts: Array.from(actsMap.values()),
  }
}

async function assertActiveLiturgy(id: number, db: Database): Promise<Liturgy> {
  const [liturgy] = await db
    .select()
    .from(liturgies)
    .where(and(eq(liturgies.id, id), isNull(liturgies.deleted_at)))
    .limit(1)
  if (!liturgy) throw new LiturgyNotFoundError(id)
  return liturgy
}

async function assertTreeScope(id: number, input: { acts: LiturgyTreeInput['acts'] }, db: Database): Promise<void> {
  const actRows = await db.select({ id: liturgyActs.id }).from(liturgyActs).where(eq(liturgyActs.liturgy_id, id))
  const allowedActIds = new Set(actRows.map((row) => row.id))
  const submittedActIds = input.acts.flatMap((act) => (act.id ? [act.id] : []))
  if (submittedActIds.some((actId) => !allowedActIds.has(actId))) throw new LiturgyTreeScopeError()

  const momentRows = await db
    .select({ id: liturgyMoments.id, actId: liturgyMoments.act_id })
    .from(liturgyMoments)
    .innerJoin(liturgyActs, eq(liturgyActs.id, liturgyMoments.act_id))
    .where(eq(liturgyActs.liturgy_id, id))
  const allowedMomentActIds = new Map(momentRows.map((row) => [row.id, row.actId]))
  for (const act of input.acts) {
    for (const moment of act.moments) {
      if (!moment.id) continue
      const actId = allowedMomentActIds.get(moment.id)
      if (actId === undefined || actId !== act.id) throw new LiturgyTreeScopeError()
    }
  }
}

async function writeActsAndMoments(liturgyId: number, acts: LiturgyTreeInput['acts'], db: Database): Promise<void> {
  for (const [position, act] of acts.entries()) {
    const [insertedAct] = await db
      .insert(liturgyActs)
      .values({ liturgy_id: liturgyId, name: act.name, position })
      .returning({ id: liturgyActs.id })

    await writeMoments(insertedAct.id, act.moments, db)
  }
}

async function reconcileActsAndMoments(liturgyId: number, acts: LiturgyTreeInput['acts'], db: Database): Promise<void> {
  const existingActs = await db
    .select({ id: liturgyActs.id })
    .from(liturgyActs)
    .where(eq(liturgyActs.liturgy_id, liturgyId))
  const submittedActIds = new Set(acts.flatMap((act) => (act.id ? [act.id] : [])))

  for (const act of existingActs) {
    if (!submittedActIds.has(act.id)) {
      await db.delete(liturgyMoments).where(eq(liturgyMoments.act_id, act.id))
      await db.delete(liturgyActs).where(eq(liturgyActs.id, act.id))
    }
  }

  for (const [position, act] of acts.entries()) {
    const actId = act.id
    if (actId) {
      await db.update(liturgyActs).set({ name: act.name, position }).where(eq(liturgyActs.id, actId))
      await reconcileMoments(actId, act.moments, db)
      continue
    }

    const [insertedAct] = await db
      .insert(liturgyActs)
      .values({ liturgy_id: liturgyId, name: act.name, position })
      .returning({ id: liturgyActs.id })
    await writeMoments(insertedAct.id, act.moments, db)
  }
}

async function writeMoments(
  actId: number,
  moments: LiturgyTreeInput['acts'][number]['moments'],
  db: Database
): Promise<void> {
  for (const [position, moment] of moments.entries()) {
    await db.insert(liturgyMoments).values({ act_id: actId, position, ...normalizeMomentForType(moment) })
  }
}

async function reconcileMoments(
  actId: number,
  moments: LiturgyTreeInput['acts'][number]['moments'],
  db: Database
): Promise<void> {
  const existingMoments = await db
    .select({ id: liturgyMoments.id })
    .from(liturgyMoments)
    .where(eq(liturgyMoments.act_id, actId))
  const submittedMomentIds = new Set(moments.flatMap((moment) => (moment.id ? [moment.id] : [])))

  for (const moment of existingMoments) {
    if (!submittedMomentIds.has(moment.id)) {
      await db.delete(liturgyMoments).where(eq(liturgyMoments.id, moment.id))
    }
  }

  for (const [position, moment] of moments.entries()) {
    const values = { position, ...normalizeMomentForType(moment) }
    if (moment.id) {
      await db.update(liturgyMoments).set(values).where(eq(liturgyMoments.id, moment.id))
      continue
    }

    await db.insert(liturgyMoments).values({ act_id: actId, ...values })
  }
}

function addMinutesToHHMM(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = Math.min(h * 60 + m + minutes, 23 * 60 + 59)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

const liturgyCardColumns = {
  id: liturgies.id,
  date: liturgies.date,
  theme: liturgies.theme,
  time: liturgies.time,
  status: liturgies.status,
  description: liturgies.description,
} as const

type LiturgyCardRow = {
  id: number
  date: Date
  theme: string
  time: string | null
  status: LiturgyStatus
  description: string | null
}

/** The sermon lives in a Momento inside an Ato, so joining for it would multiply each liturgy by
 * its acts and make any `limit` count act rows instead of liturgies. Hence a second query, run
 * over the page of liturgies already chosen. */
async function withSermons(rows: LiturgyCardRow[], db: Database): Promise<LiturgyListItem[]> {
  const sermons =
    rows.length === 0
      ? []
      : await db
          .select({
            liturgyId: liturgyActs.liturgy_id,
            description: liturgyMoments.description,
            speaker: liturgyMoments.sermon_speaker,
          })
          .from(liturgyMoments)
          .innerJoin(liturgyActs, eq(liturgyActs.id, liturgyMoments.act_id))
          .where(
            and(
              eq(liturgyMoments.type, 'sermon'),
              inArray(
                liturgyActs.liturgy_id,
                rows.map((row) => row.id)
              )
            )
          )
          .orderBy(asc(liturgyActs.position), asc(liturgyMoments.position))

  const firstSermon = new Map<number, (typeof sermons)[number]>()
  for (const sermon of sermons) {
    if (!firstSermon.has(sermon.liturgyId)) firstSermon.set(sermon.liturgyId, sermon)
  }

  return rows.map((row) => ({
    id: row.id,
    date: row.date,
    theme: row.theme,
    time: hhmm(row.time)!,
    status: row.status,
    description: row.description ?? null,
    sermonDescription: firstSermon.get(row.id)?.description ?? null,
    sermonSpeaker: firstSermon.get(row.id)?.speaker ?? null,
  }))
}

/** The caller must word each kind differently: announcing a `last-held` as if it were the next
 * service misleads whoever is planning a visit. */
export type NextLiturgyResult = { liturgy: LiturgyListItem; kind: 'today' | 'future' | 'last-held' }

/** Takes no visibility scope on purpose: highlighting is selecting, not rendering, so a Rascunho
 * never wins the spot even for an operator who could open it (see ADR-0020). */
export async function getNextLiturgy(
  { today, currentTime }: { today: Date; currentTime: string },
  db: Database = defaultDb
): Promise<NextLiturgyResult | undefined> {
  const todayRows = await db
    .select(liturgyCardColumns)
    .from(liturgies)
    .where(and(isNull(liturgies.deleted_at), eq(liturgies.date, today), visibleLiturgy('published-only')))
    .orderBy(asc(liturgies.time))

  const upcoming = todayRows.find((row) => row.time !== null && currentTime <= addMinutesToHHMM(hhmm(row.time)!, 60))
  if (upcoming) return { liturgy: (await withSermons([upcoming], db))[0], kind: 'today' }

  const [future] = await db
    .select(liturgyCardColumns)
    .from(liturgies)
    .where(and(isNull(liturgies.deleted_at), gt(liturgies.date, today), visibleLiturgy('published-only')))
    .orderBy(asc(liturgies.date), asc(liturgies.time))
    .limit(1)
  if (future) return { liturgy: (await withSermons([future], db))[0], kind: 'future' }

  const [fallback] = await db
    .select(liturgyCardColumns)
    .from(liturgies)
    .where(and(isNull(liturgies.deleted_at), lte(liturgies.date, today), visibleLiturgy('published-only')))
    .orderBy(desc(liturgies.date), desc(liturgies.time))
    .limit(1)
  if (!fallback) return undefined

  return { liturgy: (await withSermons([fallback], db))[0], kind: 'last-held' }
}
