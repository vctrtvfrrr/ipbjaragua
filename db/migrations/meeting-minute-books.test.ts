import { PGlite } from '@electric-sql/pglite'
import { describe, expect, it } from 'vitest'
import { applyMigration, applyMigrationsBefore } from '@/tests/migrations'

const MIGRATION = 'meeting_minute_books'

async function legacyDatabase() {
  const client = new PGlite()
  await applyMigrationsBefore(client, MIGRATION)
  return client
}

describe('meeting minute books migration', () => {
  it('backfills every existing Ata into the Mesa Administrativa Livro', async () => {
    const client = await legacyDatabase()
    await client.query(
      `INSERT INTO meeting_minutes
         (number, title, started_at, ended_at, location, attendees, opening, closing, status)
       VALUES (1, 'Reunião ordinária', '2026-06-07T19:30:00Z', '2026-06-07T21:00:00Z',
               'Salão social', 'Pastor João', 'Aberta com oração', 'Encerrada', 'approved')`
    )

    await applyMigration(client, MIGRATION)

    const { rows } = await client.query<{ book: string }>('SELECT book FROM meeting_minutes')
    expect(rows).toEqual([{ book: 'mesa-administrativa' }])
  })

  it('swaps the global unicidade of Número for unicidade per Livro and Número', async () => {
    const client = await legacyDatabase()
    await applyMigration(client, MIGRATION)

    async function insertMinute(book: string, number: number) {
      return client.query(
        `INSERT INTO meeting_minutes
           (book, number, title, started_at, ended_at, location, attendees, opening, closing, status)
         VALUES ($1, $2, 'Reunião', '2026-06-07T19:30:00Z', '2026-06-07T21:00:00Z',
                 'Salão social', 'Pastor João', 'Aberta com oração', 'Encerrada', 'pending')`,
        [book, number]
      )
    }

    await insertMinute('mesa-administrativa', 1)

    await expect(insertMinute('mesa-administrativa', 1)).rejects.toThrow()
    await expect(insertMinute('secretaria-de-musica', 1)).resolves.toBeDefined()
  })

  it('grants every existing Ata permission the Mesa Administrativa scope, and no other', async () => {
    const client = await legacyDatabase()
    await client.query(`INSERT INTO users (email, status) VALUES ('admin@example.com', 'active')`)
    await client.query(
      `INSERT INTO user_permissions (user_id, entity, action)
       SELECT id, entity, action
       FROM users, (VALUES
         ('meeting_minutes'::permission_entity, 'read'::permission_action),
         ('meeting_minutes', 'create'),
         ('articles', 'update')
       ) AS grants(entity, action)`
    )

    await applyMigration(client, MIGRATION)

    const { rows } = await client.query<{ entity: string; action: string; scope: string }>(
      'SELECT entity, action, scope FROM user_permissions ORDER BY entity, action'
    )
    expect(rows).toEqual([
      { entity: 'articles', action: 'update', scope: '' },
      { entity: 'meeting_minutes', action: 'read', scope: 'mesa-administrativa' },
      { entity: 'meeting_minutes', action: 'create', scope: 'mesa-administrativa' },
    ])
  })

  it('zeroes the PDF cache path of every Ata, so the next access regenerates the new header', async () => {
    const client = await legacyDatabase()
    await client.query(
      `INSERT INTO meeting_minutes
         (number, title, started_at, ended_at, location, attendees, opening, closing, status, pdf_path)
       VALUES (1, 'Reunião', '2026-06-07T19:30:00Z', '2026-06-07T21:00:00Z',
               'Salão social', 'Pastor João', 'Aberta com oração', 'Encerrada', 'approved', '${'a'.repeat(48)}.pdf')`
    )

    await applyMigration(client, MIGRATION)

    const { rows } = await client.query<{ pdf_path: string | null }>('SELECT pdf_path FROM meeting_minutes')
    expect(rows).toEqual([{ pdf_path: null }])
  })
})
