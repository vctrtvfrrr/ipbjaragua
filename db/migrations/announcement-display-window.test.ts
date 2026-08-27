import { PGlite } from '@electric-sql/pglite'
import { beforeEach, describe, expect, it } from 'vitest'
import { applyMigration, applyMigrationsBefore } from '@/tests/migrations'

const MIGRATION = 'announcement_display_window'

async function legacyDatabase() {
  const client = new PGlite()
  await applyMigrationsBefore(client, MIGRATION)
  return client
}

async function insertLegacyAnnouncement(
  client: PGlite,
  { title, expires_at, created_at }: { title: string; expires_at: string; created_at: string }
) {
  await client.query(
    'INSERT INTO announcements (title, description, expires_at, created_at) VALUES ($1, $2, $3, $4)',
    [title, 'Descrição', expires_at, created_at]
  )
}

async function startsAtOf(client: PGlite, title: string) {
  const { rows } = await client.query<{ starts_at: Date }>('SELECT starts_at FROM announcements WHERE title = $1', [
    title,
  ])
  return rows[0]?.starts_at.toISOString().slice(0, 10)
}

describe('announcement display window migration', () => {
  let client: PGlite

  beforeEach(async () => {
    client = await legacyDatabase()
  })

  it('opens the window of a still-running announcement on the day it was created', async () => {
    await insertLegacyAnnouncement(client, {
      title: 'Ainda vigente',
      expires_at: '2026-12-31',
      created_at: '2026-06-07T14:00:00-03:00',
    })

    await applyMigration(client, MIGRATION)

    expect(await startsAtOf(client, 'Ainda vigente')).toBe('2026-06-07')
  })

  it('dates the creation day by the church clock, not by the session time zone', async () => {
    await insertLegacyAnnouncement(client, {
      title: 'Criado à noite',
      expires_at: '2026-12-31',
      created_at: '2026-06-07T23:30:00-03:00',
    })

    await applyMigration(client, MIGRATION)

    expect(await startsAtOf(client, 'Criado à noite')).toBe('2026-06-07')
  })

  it('closes the window of an already expired announcement on its own end', async () => {
    await insertLegacyAnnouncement(client, {
      title: 'Já expirado',
      expires_at: '2020-01-02',
      created_at: '2026-06-07T14:00:00-03:00',
    })

    await applyMigration(client, MIGRATION)

    expect(await startsAtOf(client, 'Já expirado')).toBe('2020-01-02')
  })

  it('requires a start on every announcement written afterwards', async () => {
    await applyMigration(client, MIGRATION)

    await expect(
      client.query('INSERT INTO announcements (title, description, expires_at) VALUES ($1, $2, $3)', [
        'Sem início',
        'Descrição',
        '2026-07-12',
      ])
    ).rejects.toThrow()
  })

  it('refuses a window that closes before it opens', async () => {
    await applyMigration(client, MIGRATION)

    await expect(
      client.query('INSERT INTO announcements (title, description, starts_at, expires_at) VALUES ($1, $2, $3, $4)', [
        'Janela invertida',
        'Descrição',
        '2026-07-13',
        '2026-07-12',
      ])
    ).rejects.toThrow()
  })
})
