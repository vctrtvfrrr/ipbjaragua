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

describe('announcement flyer migration', () => {
  it('drops announcement image links without changing announcements or the featured image collection', async () => {
    const client = new PGlite()
    const migrationFiles = (await readdir(migrationsDirectory))
      .filter((file) => /^\d{4}_.+\.sql$/.test(file))
      .sort()
    const flyerMigrationIndex = migrationFiles.findIndex((file) => file === '0013_fearless_wraith.sql')

    for (const file of migrationFiles.slice(0, flyerMigrationIndex)) {
      await applySql(client, await readFile(join(migrationsDirectory, file), 'utf8'))
    }

    await client.exec(`
      INSERT INTO featured_images (path) VALUES ('${'a'.repeat(48)}.webp');
      INSERT INTO announcements (title, description, expires_at, featured_image_id)
      VALUES ('Aviso existente', 'Descrição original', '2026-07-31', 1);
    `)

    await applySql(client, await readFile(join(migrationsDirectory, migrationFiles[flyerMigrationIndex]), 'utf8'))

    const announcement = await client.query<{
      title: string
      description: string
      expires_at: Date
      flyer_path: string | null
    }>('SELECT title, description, expires_at, flyer_path FROM announcements')
    expect(announcement.rows[0]).toMatchObject({
      title: 'Aviso existente',
      description: 'Descrição original',
      flyer_path: null,
    })
    expect(announcement.rows[0]?.expires_at.toISOString().slice(0, 10)).toBe('2026-07-31')

    const columns = await client.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'announcements'`
    )
    expect(columns.rows.map(({ column_name }) => column_name)).not.toContain('featured_image_id')
    expect((await client.query('SELECT path FROM featured_images')).rows).toEqual([{ path: `${'a'.repeat(48)}.webp` }])
  })
})
