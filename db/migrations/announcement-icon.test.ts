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

describe('announcement icon migration', () => {
  it('backfills Pin for existing announcements and makes the column required', async () => {
    const client = new PGlite()
    const migrationFiles = (await readdir(migrationsDirectory))
      .filter((file) => /^\d{4}_.+\.sql$/.test(file))
      .sort()

    const iconMigrationIndex = migrationFiles.findIndex((file) => file === '0012_lyrical_bullseye.sql')

    for (const file of migrationFiles.slice(0, iconMigrationIndex)) {
      await applySql(client, await readFile(join(migrationsDirectory, file), 'utf8'))
    }

    await client.exec(`
      INSERT INTO announcements (title, description, expires_at)
      VALUES ('Aviso existente', 'Descrição', '2026-07-12')
    `)

    await applySql(client, await readFile(join(migrationsDirectory, migrationFiles[iconMigrationIndex]), 'utf8'))

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
