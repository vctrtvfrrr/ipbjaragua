import { describe, expect, it } from 'vitest'
import { can, PERMISSION_ACTIONS, PERMISSION_CATALOG, PERMISSION_ENTITIES, type Permission } from './authz'

describe('PERMISSION_CATALOG', () => {
  it('enumerates every entity/action pair exactly once', () => {
    const catalogSize = PERMISSION_ENTITIES.length * PERMISSION_ACTIONS.length
    expect(PERMISSION_CATALOG).toHaveLength(catalogSize)
    expect(new Set(PERMISSION_CATALOG.map((permission) => `${permission.entity}:${permission.action}`))).toHaveLength(
      catalogSize
    )

    for (const entity of PERMISSION_ENTITIES) {
      for (const action of PERMISSION_ACTIONS) {
        expect(PERMISSION_CATALOG).toContainEqual({ entity, action })
      }
    }
  })
})

describe('can', () => {
  const permissions: Permission[] = [
    { entity: 'bulletins', action: 'read' },
    { entity: 'articles', action: 'update' },
  ]

  it('allows an action when the matching permission exists', () => {
    expect(can(permissions, 'bulletins', 'read')).toBe(true)
  })

  it('denies an action when the matching permission does not exist', () => {
    expect(can(permissions, 'bulletins', 'delete')).toBe(false)
    expect(can(permissions, 'songs', 'read')).toBe(false)
  })
})
