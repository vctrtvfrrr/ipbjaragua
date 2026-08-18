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

describe('featured image update permission migration', () => {
  it('drops the inert featured_images:update grants and keeps every other permission', async () => {
    const client = new PGlite()
    const migrationFiles = (await readdir(migrationsDirectory))
      .filter((file) => /^\d{4}_.+\.sql$/.test(file))
      .sort()

    const cleanupIndex = migrationFiles.findIndex((file) => file === '0014_drop_inert_featured_image_update.sql')
    expect(cleanupIndex).toBeGreaterThanOrEqual(0)

    for (const file of migrationFiles.slice(0, cleanupIndex)) {
      await applySql(client, await readFile(join(migrationsDirectory, file), 'utf8'))
    }

    await client.exec(`
      INSERT INTO users (email, status) VALUES ('admin@example.com', 'active')
    `)
    await client.exec(`
      INSERT INTO user_permissions (user_id, entity, action)
      SELECT id, entity, action
      FROM users, (VALUES
        ('featured_images'::permission_entity, 'read'::permission_action),
        ('featured_images', 'create'),
        ('featured_images', 'update'),
        ('featured_images', 'delete'),
        ('articles', 'update')
      ) AS grants(entity, action)
    `)

    await applySql(client, await readFile(join(migrationsDirectory, migrationFiles[cleanupIndex]), 'utf8'))

    const { rows } = await client.query<{ entity: string; action: string }>(
      'SELECT entity, action FROM user_permissions ORDER BY entity, action'
    )

    expect(rows).toEqual([
      { entity: 'articles', action: 'update' },
      { entity: 'featured_images', action: 'read' },
      { entity: 'featured_images', action: 'create' },
      { entity: 'featured_images', action: 'delete' },
    ])
  })
})
