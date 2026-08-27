import { beforeEach, describe, expect, it } from 'vitest'
import { createTestDb, type TestDb } from '@/tests/db'
import { seedAnnouncements } from '@/tests/seed'
import { listAnnouncementsForAdmin } from './announcements'

describe('listAnnouncementsForAdmin', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('lists the most recently started announcements first', async () => {
    await seedAnnouncements(db, [
      { title: 'Começou em junho', starts_at: '2026-06-01', expires_at: '2026-12-31' },
      { title: 'Começa em agosto', starts_at: '2026-08-01', expires_at: '2026-12-31' },
      { title: 'Começou em julho', starts_at: '2026-07-01', expires_at: '2026-12-31' },
    ])

    const result = await listAnnouncementsForAdmin({ page: 1, pageSize: 20 }, db)

    expect(result.map((a) => a.title)).toEqual(['Começa em agosto', 'Começou em julho', 'Começou em junho'])
  })

  it('breaks a tie on the start by the newest announcement', async () => {
    await seedAnnouncements(db, [
      { title: 'Primeiro', starts_at: '2026-07-01', expires_at: '2026-12-31' },
      { title: 'Segundo', starts_at: '2026-07-01', expires_at: '2026-12-31' },
    ])

    const result = await listAnnouncementsForAdmin({ page: 1, pageSize: 20 }, db)

    expect(result.map((a) => a.title)).toEqual(['Segundo', 'Primeiro'])
  })
})
