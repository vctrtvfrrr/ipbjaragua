import { describe, expect, it } from 'vitest'
import {
  actionsFor,
  can,
  isDeclaredPermission,
  PERMISSION_ACTIONS,
  PERMISSION_CATALOG,
  PERMISSION_ENTITIES,
  USER_MANAGEMENT_PERMISSIONS,
  type Permission,
} from './authz'

describe('PERMISSION_CATALOG', () => {
  it('enumerates every declared entity/action pair exactly once', () => {
    const keys = PERMISSION_CATALOG.map((permission) => `${permission.entity}:${permission.action}`)
    expect(new Set(keys)).toHaveLength(keys.length)

    for (const entity of PERMISSION_ENTITIES) {
      for (const action of actionsFor(entity)) {
        expect(PERMISSION_CATALOG).toContainEqual({ entity, action })
      }
    }
  })

  it('omits actions an entity does not declare', () => {
    for (const entity of PERMISSION_ENTITIES) {
      const declared = actionsFor(entity)
      for (const action of PERMISSION_ACTIONS.filter((candidate) => !declared.includes(candidate))) {
        expect(PERMISSION_CATALOG).not.toContainEqual({ entity, action })
      }
    }
  })

  it('gives every entity a read action so write actions can imply it', () => {
    for (const entity of PERMISSION_ENTITIES) {
      expect(actionsFor(entity)).toContain('read')
    }
  })

  it('declares Featured Images without an update action', () => {
    expect(actionsFor('featured_images')).toEqual(['read', 'create', 'delete'])
  })

  it('declares Atas without a delete action', () => {
    expect(actionsFor('meeting_minutes')).toEqual(['read', 'create', 'update'])
  })

  it('keeps the user management floor inside the catalog', () => {
    for (const permission of USER_MANAGEMENT_PERMISSIONS) {
      expect(PERMISSION_CATALOG).toContainEqual(permission)
    }
  })
})

describe('isDeclaredPermission', () => {
  it('accepts a declared pair', () => {
    expect(isDeclaredPermission('featured_images', 'delete')).toBe(true)
  })

  it('rejects a pair the entity does not declare', () => {
    expect(isDeclaredPermission('featured_images', 'update')).toBe(false)
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

  it('denies an undeclared action even when a stale grant is stored', () => {
    expect(can([{ entity: 'featured_images', action: 'update' }], 'featured_images', 'update')).toBe(false)
  })
})
