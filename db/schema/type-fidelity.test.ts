import { sql } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { liturgies, liturgyActs, liturgyMoments, members, songs } from '@/db/schema'
import { parseISODate } from '@/lib/date'
import type { LyricsBlock } from '@/lib/song'
import { createTestDb, type TestDb } from '@/tests/db'

async function seedAct(db: TestDb): Promise<number> {
  const [liturgy] = await db
    .insert(liturgies)
    .values({ date: parseISODate('2026-06-07'), theme: 'Culto Solene' })
    .returning({ id: liturgies.id })
  const [act] = await db
    .insert(liturgyActs)
    .values({ liturgy_id: liturgy.id, position: 1, name: 'Consagração' })
    .returning({ id: liturgyActs.id })
  return act.id
}

describe('identity columns', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('generates sequential ids on insert', async () => {
    const [first] = await db
      .insert(members)
      .values({ full_name: 'Ana', status: 'active' })
      .returning({ id: members.id })
    const [second] = await db
      .insert(members)
      .values({ full_name: 'Bruno', status: 'active' })
      .returning({ id: members.id })

    expect(second.id).toBe(first.id + 1)
  })
})

describe('pgEnum columns', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('rejects a member status outside the enum', async () => {
    await expect(db.execute(sql`INSERT INTO members (full_name, status) VALUES ('Ana', 'bishop')`)).rejects.toThrow()
  })

  it('accepts a member status inside the enum', async () => {
    await expect(
      db.execute(sql`INSERT INTO members (full_name, status) VALUES ('Ana', 'active')`)
    ).resolves.toBeDefined()
  })
})

describe('sacrament_type_required check', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('rejects a sacrament moment without a sacrament type', async () => {
    const actId = await seedAct(db)

    await expect(db.insert(liturgyMoments).values({ act_id: actId, position: 1, type: 'sacrament' })).rejects.toThrow()
  })

  it('accepts a sacrament moment that specifies its type', async () => {
    const actId = await seedAct(db)

    await expect(
      db.insert(liturgyMoments).values({ act_id: actId, position: 1, type: 'sacrament', sacrament_type: 'eucharist' })
    ).resolves.toBeDefined()
  })

  it('accepts a non-sacrament moment without a sacrament type', async () => {
    const actId = await seedAct(db)

    await expect(
      db.insert(liturgyMoments).values({ act_id: actId, position: 1, type: 'prayer' })
    ).resolves.toBeDefined()
  })
})

describe('jsonb round-trip', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('preserves the lyric block structure of a song', async () => {
    const lyrics: LyricsBlock[] = [
      { type: 'verse', number: 1, content: 'Sublime graça' },
      { type: 'chorus', number: null, content: 'Quão doce a voz' },
    ]

    await db.insert(songs).values({ slug: 'sublime-graca', title: 'Sublime Graça', lyrics })
    const [row] = await db.select().from(songs)

    expect(row.lyrics).toEqual(lyrics)
    expect(row.lyrics?.[1].number).toBeNull()
  })

  it('preserves scripture passages on a moment', async () => {
    const actId = await seedAct(db)
    const passages = [{ reference: 'Salmos 23', text: 'O Senhor é o meu pastor', version: 'ARA' }]

    await db
      .insert(liturgyMoments)
      .values({ act_id: actId, position: 1, type: 'bible_reading', scripture_passages: passages })
    const [row] = await db.select().from(liturgyMoments)

    expect(row.scripture_passages).toEqual(passages)
  })
})
