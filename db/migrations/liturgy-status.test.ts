import { PGlite } from '@electric-sql/pglite'
import { describe, expect, it } from 'vitest'
import { applyMigration, applyMigrationsBefore } from '@/tests/migrations'

describe('liturgy status migration', () => {
  it('preserves date-based visibility when backfilling existing liturgies', async () => {
    const client = new PGlite()
    await applyMigrationsBefore(client, 'wooden_donald_blake')

    await client.exec(`
      INSERT INTO liturgies (date, theme, time)
      VALUES
        (((CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date - 1), 'Past service', '09:00'),
        ((CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date, 'Today service', '09:00'),
        (((CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date + 1), 'Future service', '09:00')
    `)

    await applyMigration(client, 'wooden_donald_blake')

    const { rows } = await client.query<{ theme: string; status: string }>(
      'SELECT theme, status FROM liturgies ORDER BY date'
    )

    expect(rows).toEqual([
      { theme: 'Past service', status: 'published' },
      { theme: 'Today service', status: 'published' },
      { theme: 'Future service', status: 'draft' },
    ])
  })
})
