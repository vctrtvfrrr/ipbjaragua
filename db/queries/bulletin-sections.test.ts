import { sql } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { formatISODate, parseISODate } from '@/lib/date'
import { createTestDb, type TestDb } from '@/tests/db'
import { seedAgenda, seedAnnouncements, seedMembers } from '@/tests/seed'
import { listActiveAnnouncements, listAgendaInWindow, listAnniversariesInWindow } from './bulletin-sections'

describe('listAgendaInWindow', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('includes an event whose date falls in the window', async () => {
    await seedAgenda(db, [{ title: 'Reunião', event_date: '2026-06-10' }])

    const result = await listAgendaInWindow(parseISODate('2026-06-07'), parseISODate('2026-06-13'), db)

    expect(formatISODate(result[0].resolvedDate)).toBe('2026-06-10')
  })

  it('excludes an event outside the window', async () => {
    await seedAgenda(db, [{ title: 'Fora', event_date: '2026-06-20' }])

    const result = await listAgendaInWindow(parseISODate('2026-06-07'), parseISODate('2026-06-13'), db)

    expect(result).toHaveLength(0)
  })

  it('returns events ordered by resolved date then time', async () => {
    await seedAgenda(db, [
      { title: 'Quarta', event_date: '2026-06-10', time: '19:30' },
      { title: 'Domingo', event_date: '2026-06-07', time: '10:00' },
    ])

    const result = await listAgendaInWindow(parseISODate('2026-06-07'), parseISODate('2026-06-13'), db)

    expect(result.map((e) => e.title)).toEqual(['Domingo', 'Quarta'])
  })

  it('excludes soft-deleted events', async () => {
    await seedAgenda(db, [{ title: 'Deletado', event_date: '2026-06-07', time: '10:00' }])
    await db.execute(sql`UPDATE agenda SET deleted_at = CURRENT_TIMESTAMP WHERE title = 'Deletado'`)

    const result = await listAgendaInWindow(parseISODate('2026-06-07'), parseISODate('2026-06-13'), db)

    expect(result).toHaveLength(0)
  })
})

describe('listActiveAnnouncements', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('returns announcements not yet expired as of the given date', async () => {
    await seedAnnouncements(db, [
      { title: 'Vigente', expires_at: '2026-06-07' },
      { title: 'Expirado', expires_at: '2026-06-06' },
    ])

    const result = await listActiveAnnouncements(parseISODate('2026-06-07'), db)

    expect(result.map((a) => a.title)).toEqual(['Vigente'])
  })

  it('orders by nearest expiration first', async () => {
    await seedAnnouncements(db, [
      { title: 'Longe', expires_at: '2026-07-01' },
      { title: 'Perto', expires_at: '2026-06-10' },
    ])

    const result = await listActiveAnnouncements(parseISODate('2026-06-07'), db)

    expect(result.map((a) => a.title)).toEqual(['Perto', 'Longe'])
  })

  it('excludes soft-deleted announcements', async () => {
    await seedAnnouncements(db, [{ title: 'Deletado', expires_at: '2026-12-31' }])
    await db.execute(sql`UPDATE announcements SET deleted_at = CURRENT_TIMESTAMP WHERE title = 'Deletado'`)

    const result = await listActiveAnnouncements(parseISODate('2026-06-07'), db)

    expect(result).toHaveLength(0)
  })
})

describe('listAnniversariesInWindow', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('groups birth anniversaries by day with weekday header', async () => {
    await seedMembers(db, [
      { full_name: 'João Silva', birth_date: '1990-06-10', status: 'active' },
      { full_name: 'Maria Santos', birth_date: '1985-01-15', status: 'active' },
    ])

    const result = await listAnniversariesInWindow(parseISODate('2026-06-07'), parseISODate('2026-06-13'), db)

    expect(result).toEqual([{ md: '10/06', weekday: 'Quarta-feira', names: ['João Silva'] }])
  })

  it('excludes inactive members from birth anniversaries', async () => {
    await seedMembers(db, [{ full_name: 'Transferido', birth_date: '1990-06-10', status: 'transferred' }])

    const result = await listAnniversariesInWindow(parseISODate('2026-06-07'), parseISODate('2026-06-13'), db)

    expect(result).toHaveLength(0)
  })

  it('excludes members without birth_date', async () => {
    await seedMembers(db, [{ full_name: 'Sem data', birth_date: null, status: 'active' }])

    const result = await listAnniversariesInWindow(parseISODate('2026-06-07'), parseISODate('2026-06-13'), db)

    expect(result).toHaveLength(0)
  })

  it('handles year-wrap windows (Dec→Jan) for birth anniversaries', async () => {
    await seedMembers(db, [
      { full_name: 'Dezembro', birth_date: '1990-12-30', status: 'active' },
      { full_name: 'Janeiro', birth_date: '1990-01-02', status: 'active' },
      { full_name: 'Fora', birth_date: '1990-06-15', status: 'active' },
    ])

    const result = await listAnniversariesInWindow(parseISODate('2026-12-28'), parseISODate('2027-01-03'), db)

    expect(result.map((d) => d.names).flat()).toEqual(['Dezembro', 'Janeiro'])
  })

  it('matches a couple by wedding date across a year-wrap window', async () => {
    await seedMembers(db, [
      { full_name: 'Ana Lima', sex: 'Feminino', wedding_date: '2010-12-31', spouse: 'Bruno Lima', status: 'active' },
      { full_name: 'Bruno Lima', sex: 'Masculino', wedding_date: '2010-12-31', spouse: 'Ana Lima', status: 'active' },
      { full_name: 'Clara Reis', birth_date: '1992-01-02', status: 'active' },
    ])

    const result = await listAnniversariesInWindow(parseISODate('2026-12-28'), parseISODate('2027-01-03'), db)

    expect(result.map((d) => ({ md: d.md, names: d.names }))).toEqual([
      { md: '31/12', names: ['Ana Lima ♥ Bruno Lima'] },
      { md: '02/01', names: ['Clara Reis'] },
    ])
  })

  it('orders days by month-day', async () => {
    await seedMembers(db, [
      { full_name: 'Dia 13', birth_date: '1990-06-13', status: 'active' },
      { full_name: 'Dia 08', birth_date: '1990-06-08', status: 'active' },
    ])

    const result = await listAnniversariesInWindow(parseISODate('2026-06-07'), parseISODate('2026-06-13'), db)

    expect(result.map((d) => d.md)).toEqual(['08/06', '13/06'])
  })

  it('excludes soft-deleted members', async () => {
    await seedMembers(db, [{ full_name: 'Removido', birth_date: '1990-06-10', status: 'active' }])
    await db.execute(sql`UPDATE members SET deleted_at = CURRENT_TIMESTAMP WHERE full_name = 'Removido'`)

    const result = await listAnniversariesInWindow(parseISODate('2026-06-07'), parseISODate('2026-06-13'), db)

    expect(result).toHaveLength(0)
  })

  it('groups a valid couple under their wedding day', async () => {
    await seedMembers(db, [
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

    const result = await listAnniversariesInWindow(parseISODate('2026-06-07'), parseISODate('2026-06-13'), db)

    expect(result).toEqual([{ md: '10/06', weekday: 'Quarta-feira', names: ['Ana Lúcia ♥ Júlio Cesar'] }])
  })

  it('deduplicates couples to a single name entry', async () => {
    await seedMembers(db, [
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

    const result = await listAnniversariesInWindow(parseISODate('2026-06-07'), parseISODate('2026-06-13'), db)

    expect(result[0].names).toHaveLength(1)
  })

  it('omits couple silently when one spouse is not an active member', async () => {
    await seedMembers(db, [
      {
        full_name: 'Maria de Souza',
        sex: 'Feminino',
        wedding_date: '2005-06-10',
        spouse: 'Pedro Ausente',
        status: 'active',
      },
    ])

    const result = await listAnniversariesInWindow(parseISODate('2026-06-07'), parseISODate('2026-06-13'), db)

    expect(result).toHaveLength(0)
  })

  it('omits couple when spouse member is inactive', async () => {
    await seedMembers(db, [
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

    const result = await listAnniversariesInWindow(parseISODate('2026-06-07'), parseISODate('2026-06-13'), db)

    expect(result).toHaveLength(0)
  })

  it('places birth anniversaries before wedding anniversaries on the same day', async () => {
    await seedMembers(db, [
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

    const result = await listAnniversariesInWindow(parseISODate('2026-06-07'), parseISODate('2026-06-13'), db)

    expect(result).toEqual([{ md: '10/06', weekday: 'Quarta-feira', names: ['Beatriz Costa', 'Rosa ♥ Tiago Lima'] }])
  })

  it('handles year-wrap windows for wedding anniversaries (Dec→Jan)', async () => {
    await seedMembers(db, [
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

    const result = await listAnniversariesInWindow(parseISODate('2026-12-28'), parseISODate('2027-01-03'), db)

    expect(result).toEqual([{ md: '30/12', weekday: 'Quarta-feira', names: ['Clara ♥ Diego Costa'] }])
  })
})
