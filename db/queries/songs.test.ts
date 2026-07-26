import { sql } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { createTestDb, type TestDb } from '@/tests/db'
import { seedSongs } from '@/tests/seed'
import {
  SongNotFoundError,
  SongSlugCollisionError,
  createSong,
  getSongById,
  listSongsForAdmin,
  softDeleteSong,
  updateSong,
} from './songs'

const lyrics = [{ type: 'verse' as const, number: 1, content: 'Sublime graça' }]

describe('createSong', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('inserts a song and returns the created row', async () => {
    const song = await createSong(
      {
        slug: 'sublime-graca',
        title: 'Sublime Graça',
        songwriter: 'John Newton',
        performer: 'Congregação',
        album: 'Novo Cântico',
        track: 27,
        lyrics,
      },
      db
    )

    expect(song).toMatchObject({
      id: 1,
      slug: 'sublime-graca',
      title: 'Sublime Graça',
      songwriter: 'John Newton',
      performer: 'Congregação',
      album: 'Novo Cântico',
      track: 27,
      lyrics,
      deleted_at: null,
    })
  })

  it('resolves slug collision against active and soft-deleted songs', async () => {
    await seedSongs(db, [
      { slug: 'sublime-graca', title: 'Ativa' },
      { slug: 'sublime-graca-2', title: 'Removida' },
    ])
    await db.execute(sql`UPDATE songs SET deleted_at = CURRENT_TIMESTAMP WHERE slug = 'sublime-graca-2'`)

    const song = await createSong(
      {
        slug: 'sublime-graca',
        title: 'Sublime Graça',
        songwriter: null,
        performer: null,
        album: null,
        track: null,
        lyrics,
      },
      db
    )

    expect(song.slug).toBe('sublime-graca-3')
  })

  it('throws when all slug candidates are occupied', async () => {
    await seedSongs(
      db,
      Array.from({ length: 100 }, (_, i) => ({
        slug: i === 0 ? 'lotado' : `lotado-${i + 1}`,
        title: `Música ${i + 1}`,
      }))
    )

    await expect(
      createSong(
        {
          slug: 'lotado',
          title: 'Lotado',
          songwriter: null,
          performer: null,
          album: null,
          track: null,
          lyrics,
        },
        db
      )
    ).rejects.toBeInstanceOf(SongSlugCollisionError)
  })
})

describe('updateSong', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('updates an active song by id without changing its slug', async () => {
    const [id] = await seedSongs(db, [{ slug: 'original', title: 'Original' }])

    const song = await updateSong(
      id,
      {
        title: 'Atualizada',
        songwriter: 'Autor',
        performer: null,
        album: null,
        track: null,
        lyrics: [{ type: 'chorus', number: null, content: 'Coro' }],
      },
      db
    )

    expect(song).toMatchObject({
      id,
      slug: 'original',
      title: 'Atualizada',
      songwriter: 'Autor',
      lyrics: [{ type: 'chorus', number: null, content: 'Coro' }],
    })
  })

  it('throws when the song does not exist or is soft-deleted', async () => {
    const [id] = await seedSongs(db, [{ slug: 'removida', title: 'Removida' }])
    await db.execute(sql`UPDATE songs SET deleted_at = CURRENT_TIMESTAMP WHERE id = ${id}`)

    await expect(
      updateSong(id, { title: 'X', songwriter: null, performer: null, album: null, track: null, lyrics }, db)
    ).rejects.toBeInstanceOf(SongNotFoundError)
    await expect(
      updateSong(999, { title: 'X', songwriter: null, performer: null, album: null, track: null, lyrics }, db)
    ).rejects.toBeInstanceOf(SongNotFoundError)
  })
})

describe('softDeleteSong', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('marks an active song as deleted and hides it from admin reads', async () => {
    const [id] = await seedSongs(db, [{ slug: 'ativo', title: 'Ativo' }])

    const song = await softDeleteSong(id, db)

    expect(song.deleted_at).not.toBeNull()
    expect(await getSongById(id, db)).toBeUndefined()
    expect(await listSongsForAdmin(db)).toEqual([])
  })
})

describe('listSongsForAdmin', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('returns every active song with derived references ordered by title', async () => {
    const seededIds = await seedSongs(
      db,
      Array.from({ length: 25 }, (_, index) => ({
        slug: `cantico-${index + 1}`,
        title: `Cântico ${String(25 - index).padStart(2, '0')}`,
        performer: index === 24 ? 'Coral' : null,
      }))
    )
    await db.execute(sql`UPDATE songs SET deleted_at = CURRENT_TIMESTAMP WHERE id = ${seededIds[12]}`)

    const rows = await listSongsForAdmin(db)

    expect(rows).toHaveLength(24)
    expect(rows.map((song) => song.title)).toEqual(
      Array.from({ length: 25 }, (_, index) => `Cântico ${String(index + 1).padStart(2, '0')}`).filter(
        (title) => title !== 'Cântico 13'
      )
    )
    expect(rows[0].songReference).toBe('Coral')
  })
})
