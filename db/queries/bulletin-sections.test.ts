import { sql } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { createTestDb, type TestDb } from '@/test/db'
import { seedAgenda, seedAnnouncements, seedMembers } from '@/test/seed'
import { listActiveAnnouncements, listAgendaInWindow, listBirthdaysInWindow } from './bulletin-sections'

describe('listAgendaInWindow', () => {
  let db: TestDb

  beforeEach(() => {
    db = createTestDb()
  })

  it('includes a recurring event when its weekday falls in the window', async () => {
    // 2026-06-07 is a Sunday (weekday 0). Window Sun–Sat.
    seedAgenda(db, [{ title: 'Culto', is_recurring: true, weekday: 0, time: '10:00' }])

    const result = await listAgendaInWindow('2026-06-07', '2026-06-13', db)

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Culto')
    expect(result[0].resolvedDate).toBe('2026-06-07')
  })

  it('excludes a recurring event whose weekday is outside the window', async () => {
    // Saturday (6) is NOT in a Sun–Fri window (2026-06-07..2026-06-12).
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

describe('listBirthdaysInWindow', () => {
  let db: TestDb

  beforeEach(() => {
    db = createTestDb()
  })

  it('returns active members whose month-day falls in the window', async () => {
    seedMembers(db, [
      { full_name: 'João', birth_date: '1990-06-10', status: 'active' },
      { full_name: 'Maria', birth_date: '1985-01-15', status: 'active' },
    ])

    const result = await listBirthdaysInWindow('2026-06-07', '2026-06-13', db)

    expect(result.map((m) => m.full_name)).toEqual(['João'])
  })

  it('excludes inactive members', async () => {
    seedMembers(db, [{ full_name: 'Transferido', birth_date: '1990-06-10', status: 'transferred' }])

    const result = await listBirthdaysInWindow('2026-06-07', '2026-06-13', db)

    expect(result).toHaveLength(0)
  })

  it('excludes members without birth_date', async () => {
    seedMembers(db, [{ full_name: 'Sem data', birth_date: null, status: 'active' }])

    const result = await listBirthdaysInWindow('2026-06-07', '2026-06-13', db)

    expect(result).toHaveLength(0)
  })

  it('handles year-wrap windows (Dec→Jan)', async () => {
    seedMembers(db, [
      { full_name: 'Dezembro', birth_date: '1990-12-30', status: 'active' },
      { full_name: 'Janeiro', birth_date: '1990-01-02', status: 'active' },
      { full_name: 'Fora', birth_date: '1990-06-15', status: 'active' },
    ])

    const result = await listBirthdaysInWindow('2026-12-28', '2027-01-03', db)

    expect(result.map((m) => m.full_name)).toEqual(['Dezembro', 'Janeiro'])
  })

  it('orders by month-day', async () => {
    seedMembers(db, [
      { full_name: 'Dia 13', birth_date: '1990-06-13', status: 'active' },
      { full_name: 'Dia 08', birth_date: '1990-06-08', status: 'active' },
    ])

    const result = await listBirthdaysInWindow('2026-06-07', '2026-06-13', db)

    expect(result.map((m) => m.full_name)).toEqual(['Dia 08', 'Dia 13'])
  })

  it('excludes soft-deleted members', async () => {
    seedMembers(db, [{ full_name: 'Removido', birth_date: '1990-06-10', status: 'active' }])
    db.run(sql`UPDATE members SET deleted_at = CURRENT_TIMESTAMP WHERE full_name = 'Removido'`)

    const result = await listBirthdaysInWindow('2026-06-07', '2026-06-13', db)

    expect(result).toHaveLength(0)
  })
})
