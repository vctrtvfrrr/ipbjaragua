import { describe, expect, it, beforeEach } from 'vitest'
import { parseISODate } from '@/lib/date'
import { createTestDb, type TestDb } from '@/tests/db'
import { seedAgenda } from '@/tests/seed'
import { countPastAgendaItems, listPastAgendaItems, listUpcomingAgendaItems } from './agenda'

describe('agenda admin queries', () => {
  let db: TestDb

  const now = { date: parseISODate('2026-07-07'), time: '20:15' }

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('lists upcoming events ascending before paginated past events descending', async () => {
    await seedAgenda(db, [
      { title: 'Ontem', event_date: '2026-07-06' },
      { title: 'Antigo', event_date: '2026-06-01' },
      { title: 'Hoje', event_date: '2026-07-07' },
      { title: 'Amanhã', event_date: '2026-07-08' },
    ])

    const upcoming = await listUpcomingAgendaItems(now, db)
    const past = await listPastAgendaItems({ now, page: 1, pageSize: 1 }, db)
    const pastTotal = await countPastAgendaItems(now, db)

    expect(upcoming.map((item) => item.title)).toEqual(['Hoje', 'Amanhã'])
    expect(past.map((item) => item.title)).toEqual(['Ontem'])
    expect(pastTotal).toBe(2)
  })

  it('treats an event of today whose time has passed as expired', async () => {
    await seedAgenda(db, [
      { title: 'Culto de Oração', event_date: '2026-07-07', time: '19:30' },
      { title: 'Ensaio do Coral', event_date: '2026-07-07', time: '21:00' },
    ])

    const upcoming = await listUpcomingAgendaItems(now, db)
    const past = await listPastAgendaItems({ now, page: 1, pageSize: 20 }, db)

    expect(upcoming.map((item) => item.title)).toEqual(['Ensaio do Coral'])
    expect(past.map((item) => item.title)).toEqual(['Culto de Oração'])
    expect(await countPastAgendaItems(now, db)).toBe(1)
  })

  it('keeps an event starting exactly now among the upcoming ones', async () => {
    await seedAgenda(db, [{ title: 'Começando agora', event_date: '2026-07-07', time: '20:15' }])

    const upcoming = await listUpcomingAgendaItems(now, db)

    expect(upcoming.map((item) => item.title)).toEqual(['Começando agora'])
    expect(await countPastAgendaItems(now, db)).toBe(0)
  })

  it('never expires an all-day event before its date is over', async () => {
    await seedAgenda(db, [
      { title: 'Campanha do Agasalho', event_date: '2026-07-07' },
      { title: 'Mutirão de ontem', event_date: '2026-07-06' },
    ])

    const upcoming = await listUpcomingAgendaItems(now, db)
    const past = await listPastAgendaItems({ now, page: 1, pageSize: 20 }, db)

    expect(upcoming.map((item) => item.title)).toEqual(['Campanha do Agasalho'])
    expect(past.map((item) => item.title)).toEqual(['Mutirão de ontem'])
  })

  it('splits the events of today around the current time', async () => {
    await seedAgenda(db, [
      { title: 'Oração da manhã', event_date: '2026-07-07', time: '06:00' },
      { title: 'Dia inteiro', event_date: '2026-07-07' },
      { title: 'Culto de Oração', event_date: '2026-07-07', time: '19:30' },
      { title: 'Vigília', event_date: '2026-07-07', time: '23:00' },
    ])

    const upcoming = await listUpcomingAgendaItems(now, db)
    const past = await listPastAgendaItems({ now, page: 1, pageSize: 20 }, db)

    expect(upcoming.map((item) => item.title)).toEqual(['Vigília', 'Dia inteiro'])
    expect(past.map((item) => item.title)).toEqual(['Culto de Oração', 'Oração da manhã'])
  })
})
