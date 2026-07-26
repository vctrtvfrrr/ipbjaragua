import { and, asc, eq, getTableColumns, inArray, isNull, sql } from 'drizzle-orm'
import { db as defaultDb, type Database } from '@/db'
import { songs } from '@/db/schema'
import type { LyricsBlock } from '@/lib/song'
import { songReference } from '@/lib/song'
import { buildSlugCandidates, writeWithAllocatedSlug } from './slug'

export type Song = typeof songs.$inferSelect
export type SongForAdmin = Song & { songReference: string | null }

export class SongNotFoundError extends Error {
  constructor(id: number) {
    super(`Song ${id} was not found`)
    this.name = 'SongNotFoundError'
  }
}

export class SongSlugCollisionError extends Error {
  constructor(slug: string) {
    super(`Could not allocate song slug "${slug}"`)
    this.name = 'SongSlugCollisionError'
  }
}

export type CreateSongInput = {
  title: string
  slug: string
  songwriter: string | null
  performer: string | null
  album: string | null
  track: number | null
  lyrics: LyricsBlock[]
}

export type UpdateSongInput = Omit<CreateSongInput, 'slug'>

export async function createSong(input: CreateSongInput, db: Database = defaultDb): Promise<Song> {
  const occupiedSlugs = await listOccupiedSongSlugs(input.slug, db)

  return writeWithAllocatedSlug({
    baseSlug: input.slug,
    occupiedSlugs,
    createCollisionError: (slug) => new SongSlugCollisionError(slug),
    tryWrite: async (slug) => {
      const [song] = await db
        .insert(songs)
        .values({ ...input, slug })
        .returning()
      return song
    },
  })
}

export async function updateSong(id: number, input: UpdateSongInput, db: Database = defaultDb): Promise<Song> {
  await getActiveSongById(id, db)

  const [song] = await db
    .update(songs)
    .set(input)
    .where(and(eq(songs.id, id), isNull(songs.deleted_at)))
    .returning()

  if (!song) throw new SongNotFoundError(id)
  return song
}

export async function softDeleteSong(id: number, db: Database = defaultDb): Promise<Song> {
  const [song] = await db
    .update(songs)
    .set({ deleted_at: sql`CURRENT_TIMESTAMP` })
    .where(and(eq(songs.id, id), isNull(songs.deleted_at)))
    .returning()

  if (!song) throw new SongNotFoundError(id)
  return song
}

export async function getSongById(id: number, db: Database = defaultDb): Promise<Song | undefined> {
  const rows = await db
    .select()
    .from(songs)
    .where(and(eq(songs.id, id), isNull(songs.deleted_at)))
    .limit(1)
  return rows[0]
}

export async function listSongsForAdmin(db: Database = defaultDb): Promise<SongForAdmin[]> {
  const rows = await db
    .select(getTableColumns(songs))
    .from(songs)
    .where(isNull(songs.deleted_at))
    .orderBy(asc(songs.title), asc(songs.id))

  return rows.map((song) => ({ ...song, songReference: songReference(song) }))
}

async function getActiveSongById(id: number, db: Database): Promise<Song> {
  const [song] = await db
    .select()
    .from(songs)
    .where(and(eq(songs.id, id), isNull(songs.deleted_at)))
    .limit(1)

  if (!song) throw new SongNotFoundError(id)
  return song
}

async function listOccupiedSongSlugs(slug: string, db: Database): Promise<string[]> {
  const candidates = buildSlugCandidates(slug)

  const rows = await db.select({ slug: songs.slug }).from(songs).where(inArray(songs.slug, candidates))

  return rows.map((row) => row.slug)
}
