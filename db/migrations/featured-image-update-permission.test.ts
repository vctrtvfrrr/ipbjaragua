import { PGlite } from '@electric-sql/pglite'
import { describe, expect, it } from 'vitest'
import { applyMigration, applyMigrationsBefore } from '@/tests/migrations'

describe('featured image update permission migration', () => {
  it('drops the inert featured_images:update grants and keeps every other permission', async () => {
    const client = new PGlite()
    await applyMigrationsBefore(client, 'drop_inert_featured_image_update')

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

    await applyMigration(client, 'drop_inert_featured_image_update')

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
