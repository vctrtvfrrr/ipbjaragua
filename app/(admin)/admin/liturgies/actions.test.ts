import { and, eq, isNull, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { liturgyActs, liturgyMoments, liturgies, songs } from '@/db/schema'
import type { CurrentUser } from '@/lib/auth/current-user'
import { createTestDb, type TestDb } from '@/tests/db'
import { seedLiturgies, seedSongs } from '@/tests/seed'
import { createLiturgyAction, deleteLiturgyAction, updateLiturgyAction } from './actions'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

function userWithPermission(canReturn: boolean): CurrentUser {
  return {
    id: 1,
    email: 'ana@example.com',
    name: 'Ana',
    can: vi.fn(() => canReturn),
  }
}

function formData(payload: unknown) {
  const data = new FormData()
  data.append('payload', JSON.stringify(payload))
  return data
}

function payload(overrides: Record<string, unknown> = {}) {
  return {
    date: '2026-06-07',
    theme: 'Culto Solene',
    time: '09:00',
    acts: [
      {
        name: 'Ato inicial',
        moments: [
          {
            type: 'prayer',
            description: 'Oração inicial',
            song_id: null,
            scripture_passages: [],
            sermon_speaker: '',
            sacrament_type: null,
          },
        ],
      },
    ],
    ...overrides,
  }
}

describe('createLiturgyAction.execute', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
    vi.mocked(revalidatePath).mockClear()
  })

  it('denies users without liturgy create permission without writing', async () => {
    const user = userWithPermission(false)

    const state = await createLiturgyAction.execute({ user, db }, formData(payload()))

    expect(state).toEqual({
      status: 'error',
      formError: 'Você não tem permissão para executar esta ação.',
    })
    expect(user.can).toHaveBeenCalledWith('liturgies', 'create')
    expect(await db.select().from(liturgies).where(isNull(liturgies.deleted_at))).toEqual([])
  })

  it('validates sacrament type, song content, bible passages, and minimum acts', async () => {
    const state = await createLiturgyAction.execute(
      { user: userWithPermission(true), db },
      formData(
        payload({
          acts: [
            {
              name: 'Ato',
              moments: [
                {
                  type: 'sacrament',
                  description: '',
                  song_id: null,
                  scripture_passages: [],
                  sermon_speaker: '',
                  sacrament_type: null,
                },
                {
                  type: 'song',
                  description: '',
                  song_id: null,
                  scripture_passages: [],
                  sermon_speaker: '',
                  sacrament_type: null,
                },
                {
                  type: 'bible_reading',
                  description: '',
                  song_id: null,
                  scripture_passages: [],
                  sermon_speaker: '',
                  sacrament_type: null,
                },
              ],
            },
          ],
        })
      )
    )

    expect(state.status).toBe('error')
    expect(await db.select().from(liturgies)).toEqual([])
  })

  it('inserts a nested liturgy with zero-moment acts and persisted positions', async () => {
    const [songId] = await seedSongs(db, [{ slug: 'sublime-graca', title: 'Sublime Graça' }])

    const state = await createLiturgyAction.execute(
      { user: userWithPermission(true), db },
      formData(
        payload({
          acts: [
            { name: 'Pausa', moments: [] },
            {
              name: 'Louvor',
              moments: [
                {
                  type: 'song',
                  description: '',
                  song_id: songId,
                  scripture_passages: [],
                  sermon_speaker: '',
                  sacrament_type: null,
                },
              ],
            },
          ],
        })
      )
    )

    expect(state).toEqual({ status: 'success' })
    const acts = await db.select().from(liturgyActs).orderBy(liturgyActs.position)
    expect(acts.map((act) => ({ name: act.name, position: act.position }))).toEqual([
      { name: 'Pausa', position: 0 },
      { name: 'Louvor', position: 1 },
    ])
    const moments = await db.select().from(liturgyMoments)
    expect(moments[0]).toMatchObject({ act_id: acts[1].id, position: 0, type: 'song', song_id: songId })
    expect(revalidatePath).toHaveBeenCalledWith('/liturgies/[slug]', 'page')
  })

  it('relies on the unique date/theme/time constraint', async () => {
    await seedLiturgies(db, [{ date: '2026-06-07', theme: 'Culto Solene', time: '09:00' }])

    const state = await createLiturgyAction.execute({ user: userWithPermission(true), db }, formData(payload()))

    expect(state.status).toBe('error')
    expect(await db.select().from(liturgies).where(eq(liturgies.theme, 'Culto Solene'))).toHaveLength(1)
  })
})

describe('updateLiturgyAction.execute', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
    vi.mocked(revalidatePath).mockClear()
  })

  it('reconciles insert/update/delete in one tree save and derives positions', async () => {
    const [liturgyId] = await seedLiturgies(db, [{ date: '2026-06-07', theme: 'Culto Solene', time: '09:00' }])
    const [actA] = await db
      .insert(liturgyActs)
      .values({ liturgy_id: liturgyId, name: 'Antigo A', position: 0 })
      .returning({ id: liturgyActs.id })
    const [actB] = await db
      .insert(liturgyActs)
      .values({ liturgy_id: liturgyId, name: 'Antigo B', position: 1 })
      .returning({ id: liturgyActs.id })
    const [momentA] = await db
      .insert(liturgyMoments)
      .values({ act_id: actA.id, position: 0, type: 'prayer', description: 'Antigo' })
      .returning({ id: liturgyMoments.id })
    await db.insert(liturgyMoments).values({ act_id: actB.id, position: 0, type: 'prayer', description: 'Remover' })

    const state = await updateLiturgyAction.execute(
      { user: userWithPermission(true), db },
      formData(
        payload({
          id: liturgyId,
          theme: 'Culto Atualizado',
          acts: [
            {
              id: actA.id,
              name: 'Atualizado',
              moments: [
                {
                  id: momentA.id,
                  type: 'sermon',
                  description: 'Graça',
                  song_id: null,
                  scripture_passages: [{ reference: 'Ef 2.8', text: 'Pela graça', version: 'ARA' }],
                  sermon_speaker: 'Calvino',
                  sacrament_type: null,
                },
                {
                  type: 'other',
                  description: 'Aviso',
                  song_id: null,
                  scripture_passages: [],
                  sermon_speaker: '',
                  sacrament_type: null,
                },
              ],
            },
          ],
        })
      )
    )

    expect(state).toEqual({ status: 'success' })
    expect(await db.select().from(liturgyActs).where(eq(liturgyActs.id, actB.id))).toEqual([])
    const moments = await db
      .select()
      .from(liturgyMoments)
      .where(eq(liturgyMoments.act_id, actA.id))
      .orderBy(liturgyMoments.position)
    expect(moments.map((moment) => ({ type: moment.type, position: moment.position }))).toEqual([
      { type: 'sermon', position: 0 },
      { type: 'other', position: 1 },
    ])
  })

  it('rejects forged act and moment ids from another liturgy', async () => {
    const [targetId, otherId] = await seedLiturgies(db, [
      { date: '2026-06-07', theme: 'Culto Solene', time: '09:00' },
      { date: '2026-06-08', theme: 'Culto Solene', time: '09:00' },
    ])
    const [otherAct] = await db
      .insert(liturgyActs)
      .values({ liturgy_id: otherId, name: 'Outro', position: 0 })
      .returning({ id: liturgyActs.id })
    const [otherMoment] = await db
      .insert(liturgyMoments)
      .values({ act_id: otherAct.id, position: 0, type: 'prayer', description: 'Outro' })
      .returning({ id: liturgyMoments.id })

    const state = await updateLiturgyAction.execute(
      { user: userWithPermission(true), db },
      formData(
        payload({
          id: targetId,
          acts: [
            {
              id: otherAct.id,
              name: 'Forjado',
              moments: [
                {
                  id: otherMoment.id,
                  type: 'prayer',
                  description: 'X',
                  song_id: null,
                  scripture_passages: [],
                  sermon_speaker: '',
                  sacrament_type: null,
                },
              ],
            },
          ],
        })
      )
    )

    expect(state).toEqual({
      status: 'error',
      formError: 'A Liturgia enviada contém itens que não pertencem a ela.',
    })
    const [untouched] = await db.select().from(liturgyActs).where(eq(liturgyActs.id, otherAct.id))
    expect(untouched.name).toBe('Outro')
  })

  it('rejects a moment id submitted under another act in the same liturgy', async () => {
    const [liturgyId] = await seedLiturgies(db, [{ date: '2026-06-07', theme: 'Culto Solene', time: '09:00' }])
    const [actA] = await db
      .insert(liturgyActs)
      .values({ liturgy_id: liturgyId, name: 'A', position: 0 })
      .returning({ id: liturgyActs.id })
    const [actB] = await db
      .insert(liturgyActs)
      .values({ liturgy_id: liturgyId, name: 'B', position: 1 })
      .returning({ id: liturgyActs.id })
    const [momentB] = await db
      .insert(liturgyMoments)
      .values({ act_id: actB.id, position: 0, type: 'prayer', description: 'Original' })
      .returning({ id: liturgyMoments.id })

    const state = await updateLiturgyAction.execute(
      { user: userWithPermission(true), db },
      formData(
        payload({
          id: liturgyId,
          acts: [
            {
              id: actA.id,
              name: 'A',
              moments: [
                {
                  id: momentB.id,
                  type: 'prayer',
                  description: 'Forjado',
                  song_id: null,
                  scripture_passages: [],
                  sermon_speaker: '',
                  sacrament_type: null,
                },
              ],
            },
            { id: actB.id, name: 'B', moments: [] },
          ],
        })
      )
    )

    expect(state).toEqual({
      status: 'error',
      formError: 'A Liturgia enviada contém itens que não pertencem a ela.',
    })
    const [untouched] = await db.select().from(liturgyMoments).where(eq(liturgyMoments.id, momentB.id))
    expect(untouched).toMatchObject({ act_id: actB.id, description: 'Original' })
  })

  it('normalizes fields that do not belong to the current moment type', async () => {
    const [liturgyId] = await seedLiturgies(db, [{ date: '2026-06-07', theme: 'Culto Solene', time: '09:00' }])
    const [act] = await db
      .insert(liturgyActs)
      .values({ liturgy_id: liturgyId, name: 'Ato', position: 0 })
      .returning({ id: liturgyActs.id })
    const [moment] = await db
      .insert(liturgyMoments)
      .values({
        act_id: act.id,
        position: 0,
        type: 'sermon',
        description: 'Graça',
        sermon_speaker: 'Calvino',
        scripture_passages: [{ reference: 'Ef 2.8', text: 'Pela graça', version: 'ARA' }],
      })
      .returning({ id: liturgyMoments.id })

    await updateLiturgyAction.execute(
      { user: userWithPermission(true), db },
      formData(
        payload({
          id: liturgyId,
          acts: [
            {
              id: act.id,
              name: 'Ato',
              moments: [
                {
                  id: moment.id,
                  type: 'prayer',
                  description: 'Oração',
                  song_id: 123,
                  scripture_passages: [{ reference: 'Jo 3.16', text: 'Texto', version: 'ARA' }],
                  sermon_speaker: 'Alguém',
                  sacrament_type: 'baptism',
                },
              ],
            },
          ],
        })
      )
    )

    const [updated] = await db
      .select()
      .from(liturgyMoments)
      .where(and(eq(liturgyMoments.id, moment.id), eq(liturgyMoments.type, 'prayer')))
    expect(updated).toMatchObject({
      song_id: null,
      scripture_passages: null,
      sermon_speaker: null,
      sacrament_type: null,
    })
  })

  it('denies users without liturgy update permission without writing', async () => {
    const [liturgyId] = await seedLiturgies(db, [{ date: '2026-06-07', theme: 'Culto Solene', time: '09:00' }])

    const state = await updateLiturgyAction.execute(
      { user: userWithPermission(false), db },
      formData(payload({ id: liturgyId, theme: 'Sem permissão' }))
    )

    expect(state).toEqual({
      status: 'error',
      formError: 'Você não tem permissão para executar esta ação.',
    })
    const [liturgy] = await db.select().from(liturgies).where(eq(liturgies.id, liturgyId))
    expect(liturgy.theme).toBe('Culto Solene')
  })

  it('filters soft-deleted songs from the picker options', async () => {
    const [activeId, deletedId] = await seedSongs(db, [
      { slug: 'ativo', title: 'Ativo' },
      { slug: 'apagado', title: 'Apagado' },
    ])
    await db
      .update(songs)
      .set({ deleted_at: sql`CURRENT_TIMESTAMP` })
      .where(eq(songs.id, deletedId))

    const { listSongPickerOptions } = await import('@/db/queries/liturgies')
    const options = await listSongPickerOptions(db)

    expect(options.map((option) => option.id)).toEqual([activeId])
  })
})

describe('deleteLiturgyAction.execute', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
    vi.mocked(revalidatePath).mockClear()
  })

  it('soft-deletes the liturgy without deleting child acts and moments', async () => {
    const [liturgyId] = await seedLiturgies(db, [{ date: '2026-06-07', theme: 'Culto Solene', time: '09:00' }])
    const [act] = await db
      .insert(liturgyActs)
      .values({ liturgy_id: liturgyId, name: 'Ato', position: 0 })
      .returning({ id: liturgyActs.id })
    await db.insert(liturgyMoments).values({ act_id: act.id, position: 0, type: 'prayer', description: 'Oração' })

    const state = await deleteLiturgyAction.execute({ user: userWithPermission(true), db }, formData({ id: liturgyId }))

    expect(state).toEqual({ status: 'success' })
    const [deleted] = await db.select().from(liturgies).where(eq(liturgies.id, liturgyId))
    expect(deleted.deleted_at).not.toBeNull()
    expect(await db.select().from(liturgyActs).where(eq(liturgyActs.liturgy_id, liturgyId))).toHaveLength(1)
    expect(await db.select().from(liturgyMoments).where(eq(liturgyMoments.act_id, act.id))).toHaveLength(1)
  })
})
