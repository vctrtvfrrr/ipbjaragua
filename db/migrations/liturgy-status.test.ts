import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { describe, expect, it } from 'vitest'

const migrationsDirectory = join(process.cwd(), 'db/migrations')

async function applySql(client: PGlite, sql: string) {
  for (const statement of sql.split('--> statement-breakpoint')) {
    if (statement.trim()) await client.exec(statement)
  }
}

describe('liturgy status migration', () => {
  it('preserves date-based visibility when backfilling existing liturgies', async () => {
    const client = new PGlite()
    const migrationFiles = (await readdir(migrationsDirectory))
      .filter((file) => /^\d{4}_.+\.sql$/.test(file))
      .sort()

    for (const file of migrationFiles.slice(0, -1)) {
      await applySql(client, await readFile(join(migrationsDirectory, file), 'utf8'))
    }

    await client.exec(`
      INSERT INTO liturgies (date, theme, time)
      VALUES
        (((CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date - 1), 'Past service', '09:00'),
        ((CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date, 'Today service', '09:00'),
        (((CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date + 1), 'Future service', '09:00')
    `)

    await applySql(client, await readFile(join(migrationsDirectory, migrationFiles.at(-1)!), 'utf8'))

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
