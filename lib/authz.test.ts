import { describe, expect, it } from 'vitest'
import {
  actionsFor,
  can,
  isDeclaredPermission,
  PERMISSION_ACTIONS,
  PERMISSION_CATALOG,
  PERMISSION_ENTITIES,
  scopesFor,
  USER_MANAGEMENT_PERMISSIONS,
  type Permission,
} from './authz'
import { MEETING_MINUTE_BOOK_SLUGS } from './meeting-minute-books'

describe('PERMISSION_CATALOG', () => {
  it('enumerates every declared entity/action/scope triple exactly once', () => {
    const keys = PERMISSION_CATALOG.map((permission) => `${permission.entity}:${permission.action}:${permission.scope}`)
    expect(new Set(keys)).toHaveLength(keys.length)

    for (const entity of PERMISSION_ENTITIES) {
      for (const action of actionsFor(entity)) {
        for (const scope of scopesFor(entity)) {
          expect(PERMISSION_CATALOG).toContainEqual({ entity, action, scope })
        }
      }
    }
  })

  it('omits actions an entity does not declare', () => {
    for (const entity of PERMISSION_ENTITIES) {
      const declared = actionsFor(entity)
      for (const action of PERMISSION_ACTIONS.filter((candidate) => !declared.includes(candidate))) {
        expect(
          PERMISSION_CATALOG.some((permission) => permission.entity === entity && permission.action === action)
        ).toBe(false)
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

  it('scopes the Ata to exactly the closed list of Livros', () => {
    expect(scopesFor('meeting_minutes')).toEqual(MEETING_MINUTE_BOOK_SLUGS)
  })

  it('gives every other entity no scope at all', () => {
    for (const entity of PERMISSION_ENTITIES.filter((candidate) => candidate !== 'meeting_minutes')) {
      expect(scopesFor(entity)).toEqual([''])
    }
  })

  it('keeps the user management floor inside the catalog', () => {
    for (const permission of USER_MANAGEMENT_PERMISSIONS) {
      expect(PERMISSION_CATALOG).toContainEqual({ ...permission, scope: '' })
    }
  })
})

describe('isDeclaredPermission', () => {
  it('accepts a declared pair regardless of scope', () => {
    expect(isDeclaredPermission('featured_images', 'delete')).toBe(true)
  })

  it('rejects a pair the entity does not declare', () => {
    expect(isDeclaredPermission('featured_images', 'update')).toBe(false)
  })

  it('accepts a declared pair with a Livro of the closed list', () => {
    expect(isDeclaredPermission('meeting_minutes', 'read', 'mesa-administrativa')).toBe(true)
  })

  it('rejects a Livro outside the closed list', () => {
    expect(isDeclaredPermission('meeting_minutes', 'read', 'conselho')).toBe(false)
  })

  it('rejects a non-empty scope on an entity that has none', () => {
    expect(isDeclaredPermission('bulletins', 'read', 'mesa-administrativa')).toBe(false)
  })
})

describe('can', () => {
  const permissions: Permission[] = [
    { entity: 'bulletins', action: 'read' },
    { entity: 'articles', action: 'update' },
    { entity: 'meeting_minutes', action: 'read', scope: 'mesa-administrativa' },
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

  it('allows a scoped action when the Livro matches', () => {
    expect(can(permissions, 'meeting_minutes', 'read', 'mesa-administrativa')).toBe(true)
  })

  it('denies a scoped action when the Livro does not match', () => {
    expect(can(permissions, 'meeting_minutes', 'read', 'secretaria-de-musica')).toBe(false)
  })

  it('denies a scoped grant with no scope declared, even for the matching entity/action', () => {
    const ungranted: Permission[] = [{ entity: 'meeting_minutes', action: 'read' }]

    expect(can(ungranted, 'meeting_minutes', 'read', 'mesa-administrativa')).toBe(false)
  })

  it('treats an omitted scope as "any Livro" for a coarse check', () => {
    expect(can(permissions, 'meeting_minutes', 'read')).toBe(true)
    expect(can([], 'meeting_minutes', 'read')).toBe(false)
  })
})
