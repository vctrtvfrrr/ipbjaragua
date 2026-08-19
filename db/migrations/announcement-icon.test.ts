import { PGlite } from '@electric-sql/pglite'
import { describe, expect, it } from 'vitest'
import { applyMigration, applyMigrationsBefore } from '@/tests/migrations'

describe('announcement icon migration', () => {
  it('backfills Pin for existing announcements and makes the column required', async () => {
    const client = new PGlite()
    await applyMigrationsBefore(client, 'lyrical_bullseye')

    await client.exec(`
      INSERT INTO announcements (title, description, expires_at)
      VALUES ('Aviso existente', 'Descrição', '2026-07-12')
    `)

    await applyMigration(client, 'lyrical_bullseye')

    const { rows } = await client.query<{ title: string; icon: string }>('SELECT title, icon FROM announcements')
    expect(rows).toEqual([{ title: 'Aviso existente', icon: 'Pin' }])

    await expect(
      client.query('INSERT INTO announcements (title, description, expires_at, icon) VALUES ($1, $2, $3, NULL)', [
        'Sem ícone',
        'Descrição',
        '2026-07-12',
      ])
    ).rejects.toThrow()
  })
})
