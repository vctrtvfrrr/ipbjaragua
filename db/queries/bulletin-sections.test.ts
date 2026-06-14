import { sql } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { createTestDb, type TestDb } from '@/test/db'
import { seedAgenda, seedAnnouncements, seedMembers } from '@/test/seed'
import { listActiveAnnouncements, listAgendaInWindow, listAnniversariesInWindow } from './bulletin-sections'

describe('listAgendaInWindow', () => {
  let db: TestDb

  beforeEach(() => {
    db = createTestDb()
  })

  it('includes a recurring event when its weekday falls in the window', async () => {
    seedAgenda(db, [{ title: 'Culto', is_recurring: true, weekday: 0, time: '10:00' }])

    const result = await listAgendaInWindow('2026-06-07', '2026-06-13', db)

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Culto')
    expect(result[0].resolvedDate).toBe('2026-06-07')
  })

  it('excludes a recurring event whose weekday is outside the window', async () => {
    seedAgenda(db, [{ title: 'Evento Sábado', is_recurring: true, weekday: 6, time: '09:00' }])

    const result = await listAgendaInWindow('2026-06-07', '2026-06-12', db)

    expect(result).toHaveLength(0)
  })

  it('includes a one-off event whose date falls in the window', async () => {
    seedAgenda(db, [{ title: 'Reunião', is_recurring: false, event_date: '2026-06-10' }])

    const result = await listAgendaInWindow('2026-06-07', '2026-06-13', db)

    expect(result[0].resolvedDate).toBe('2026-06-10')
  })

  it('excludes a one-off event outside the window', async () => {
    seedAgenda(db, [{ title: 'Fora', is_recurring: false, event_date: '2026-06-20' }])

    const result = await listAgendaInWindow('2026-06-07', '2026-06-13', db)

    expect(result).toHaveLength(0)
  })

  it('returns events ordered by resolved date then time', async () => {
    seedAgenda(db, [
      { title: 'Quarta', is_recurring: true, weekday: 3, time: '19:30' },
      { title: 'Domingo', is_recurring: true, weekday: 0, time: '10:00' },
    ])

    const result = await listAgendaInWindow('2026-06-07', '2026-06-13', db)

    expect(result.map((e) => e.title)).toEqual(['Domingo', 'Quarta'])
  })

  it('excludes soft-deleted events', async () => {
    seedAgenda(db, [{ title: 'Deletado', is_recurring: true, weekday: 0, time: '10:00' }])
    db.run(sql`UPDATE agenda SET deleted_at = CURRENT_TIMESTAMP WHERE title = 'Deletado'`)

    const result = await listAgendaInWindow('2026-06-07', '2026-06-13', db)

    expect(result).toHaveLength(0)
  })
})

describe('listActiveAnnouncements', () => {
  let db: TestDb

  beforeEach(() => {
    db = createTestDb()
  })

  it('returns announcements not yet expired as of the given date', async () => {
    seedAnnouncements(db, [
      { title: 'Vigente', expires_at: '2026-06-07' },
      { title: 'Expirado', expires_at: '2026-06-06' },
    ])

    const result = await listActiveAnnouncements('2026-06-07', db)

    expect(result.map((a) => a.title)).toEqual(['Vigente'])
  })

  it('orders by nearest expiration first', async () => {
    seedAnnouncements(db, [
      { title: 'Longe', expires_at: '2026-07-01' },
      { title: 'Perto', expires_at: '2026-06-10' },
    ])

    const result = await listActiveAnnouncements('2026-06-07', db)

    expect(result.map((a) => a.title)).toEqual(['Perto', 'Longe'])
  })

  it('excludes soft-deleted announcements', async () => {
    seedAnnouncements(db, [{ title: 'Deletado', expires_at: '2026-12-31' }])
    db.run(sql`UPDATE announcements SET deleted_at = CURRENT_TIMESTAMP WHERE title = 'Deletado'`)

    const result = await listActiveAnnouncements('2026-06-07', db)

    expect(result).toHaveLength(0)
  })
})

describe('listAnniversariesInWindow', () => {
  let db: TestDb

  beforeEach(() => {
    db = createTestDb()
  })

  it('groups birth anniversaries by day with weekday header', async () => {
    seedMembers(db, [
      { full_name: 'João Silva', birth_date: '1990-06-10', status: 'active' },
      { full_name: 'Maria Santos', birth_date: '1985-01-15', status: 'active' },
    ])

    const result = await listAnniversariesInWindow('2026-06-07', '2026-06-13', db)

    expect(result).toEqual([{ md: '10/06', weekday: 'Quarta-feira', names: ['João Silva'] }])
  })

  it('excludes inactive members from birth anniversaries', async () => {
    seedMembers(db, [{ full_name: 'Transferido', birth_date: '1990-06-10', status: 'transferred' }])

    const result = await listAnniversariesInWindow('2026-06-07', '2026-06-13', db)

    expect(result).toHaveLength(0)
  })

  it('excludes members without birth_date', async () => {
    seedMembers(db, [{ full_name: 'Sem data', birth_date: null, status: 'active' }])

    const result = await listAnniversariesInWindow('2026-06-07', '2026-06-13', db)

    expect(result).toHaveLength(0)
  })

  it('handles year-wrap windows (Dec→Jan) for birth anniversaries', async () => {
    seedMembers(db, [
      { full_name: 'Dezembro', birth_date: '1990-12-30', status: 'active' },
      { full_name: 'Janeiro', birth_date: '1990-01-02', status: 'active' },
      { full_name: 'Fora', birth_date: '1990-06-15', status: 'active' },
    ])

    const result = await listAnniversariesInWindow('2026-12-28', '2027-01-03', db)

    expect(result.map((d) => d.names).flat()).toEqual(['Dezembro', 'Janeiro'])
  })

  it('orders days by month-day', async () => {
    seedMembers(db, [
      { full_name: 'Dia 13', birth_date: '1990-06-13', status: 'active' },
      { full_name: 'Dia 08', birth_date: '1990-06-08', status: 'active' },
    ])

    const result = await listAnniversariesInWindow('2026-06-07', '2026-06-13', db)

    expect(result.map((d) => d.md)).toEqual(['08/06', '13/06'])
  })

  it('excludes soft-deleted members', async () => {
    seedMembers(db, [{ full_name: 'Removido', birth_date: '1990-06-10', status: 'active' }])
    db.run(sql`UPDATE members SET deleted_at = CURRENT_TIMESTAMP WHERE full_name = 'Removido'`)

    const result = await listAnniversariesInWindow('2026-06-07', '2026-06-13', db)

    expect(result).toHaveLength(0)
  })

  it('groups a valid couple under their wedding day', async () => {
    seedMembers(db, [
      {
        full_name: 'Ana Lúcia de Souza',
        sex: 'Feminino',
        wedding_date: '2005-06-10',
        spouse: 'Júlio Cesar Oliveira',
        status: 'active',
      },
      {
        full_name: 'Júlio Cesar Oliveira',
        sex: 'Masculino',
        wedding_date: '2005-06-10',
        spouse: 'Ana Lúcia de Souza',
        status: 'active',
      },
    ])

    const result = await listAnniversariesInWindow('2026-06-07', '2026-06-13', db)

    expect(result).toEqual([{ md: '10/06', weekday: 'Quarta-feira', names: ['Ana Lúcia ♥ Júlio Cesar'] }])
  })

  it('deduplicates couples to a single name entry', async () => {
    seedMembers(db, [
      {
        full_name: 'Ana de Souza',
        sex: 'Feminino',
        wedding_date: '2005-06-10',
        spouse: 'Carlos Lima',
        status: 'active',
      },
      {
        full_name: 'Carlos Lima',
        sex: 'Masculino',
        wedding_date: '2005-06-10',
        spouse: 'Ana de Souza',
        status: 'active',
      },
    ])

    const result = await listAnniversariesInWindow('2026-06-07', '2026-06-13', db)

    expect(result[0].names).toHaveLength(1)
  })

  it('omits couple silently when one spouse is not an active member', async () => {
    seedMembers(db, [
      {
        full_name: 'Maria de Souza',
        sex: 'Feminino',
        wedding_date: '2005-06-10',
        spouse: 'Pedro Ausente',
        status: 'active',
      },
    ])

    const result = await listAnniversariesInWindow('2026-06-07', '2026-06-13', db)

    expect(result).toHaveLength(0)
  })

  it('omits couple when spouse member is inactive', async () => {
    seedMembers(db, [
      {
        full_name: 'Lucia de Melo',
        sex: 'Feminino',
        wedding_date: '2005-06-10',
        spouse: 'Paulo Melo',
        status: 'active',
      },
      {
        full_name: 'Paulo Melo',
        sex: 'Masculino',
        wedding_date: '2005-06-10',
        spouse: 'Lucia de Melo',
        status: 'transferred',
      },
    ])

    const result = await listAnniversariesInWindow('2026-06-07', '2026-06-13', db)

    expect(result).toHaveLength(0)
  })

  it('places birth anniversaries before wedding anniversaries on the same day', async () => {
    seedMembers(db, [
      { full_name: 'Beatriz Costa', birth_date: '1990-06-10', status: 'active' },
      {
        full_name: 'Rosa de Lima',
        sex: 'Feminino',
        wedding_date: '2005-06-10',
        spouse: 'Tiago Lima',
        status: 'active',
      },
      {
        full_name: 'Tiago Lima',
        sex: 'Masculino',
        wedding_date: '2005-06-10',
        spouse: 'Rosa de Lima',
        status: 'active',
      },
    ])

    const result = await listAnniversariesInWindow('2026-06-07', '2026-06-13', db)

    expect(result).toEqual([{ md: '10/06', weekday: 'Quarta-feira', names: ['Beatriz Costa', 'Rosa ♥ Tiago Lima'] }])
  })

  it('handles year-wrap windows for wedding anniversaries (Dec→Jan)', async () => {
    seedMembers(db, [
      {
        full_name: 'Clara de Souza',
        sex: 'Feminino',
        wedding_date: '2000-12-30',
        spouse: 'Diego Costa',
        status: 'active',
      },
      {
        full_name: 'Diego Costa',
        sex: 'Masculino',
        wedding_date: '2000-12-30',
        spouse: 'Clara de Souza',
        status: 'active',
      },
    ])

    const result = await listAnniversariesInWindow('2026-12-28', '2027-01-03', db)

    expect(result).toEqual([{ md: '30/12', weekday: 'Quarta-feira', names: ['Clara ♥ Diego Costa'] }])
  })
})
