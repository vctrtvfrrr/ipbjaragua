import { describe, expect, it, beforeEach } from 'vitest'
import { parseISODate } from '@/lib/date'
import { createTestDb, type TestDb } from '@/tests/db'
import { seedAgenda } from '@/tests/seed'
import { countPastAgendaItems, listFutureAgendaItems, listPastAgendaItems } from './agenda'

describe('agenda admin queries', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('lists today and future events ascending before paginated past events descending', async () => {
    const today = parseISODate('2026-07-07')
    await seedAgenda(db, [
      { title: 'Ontem', event_date: '2026-07-06' },
      { title: 'Antigo', event_date: '2026-06-01' },
      { title: 'Hoje', event_date: '2026-07-07' },
      { title: 'Amanhã', event_date: '2026-07-08' },
    ])

    const future = await listFutureAgendaItems(today, db)
    const past = await listPastAgendaItems({ today, page: 1, pageSize: 1 }, db)
    const pastTotal = await countPastAgendaItems(today, db)

    expect(future.map((item) => item.title)).toEqual(['Hoje', 'Amanhã'])
    expect(past.map((item) => item.title)).toEqual(['Ontem'])
    expect(pastTotal).toBe(2)
  })
})
