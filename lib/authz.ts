import { MEETING_MINUTE_BOOK_SLUGS } from './meeting-minute-books'

export const PERMISSION_ENTITIES = [
  'bulletins',
  'articles',
  'liturgies',
  'announcements',
  'songs',
  'members',
  'agenda',
  'users',
  'featured_images',
  'meeting_minutes',
] as const

export const PERMISSION_ACTIONS = ['read', 'create', 'update', 'delete'] as const

export type Entity = (typeof PERMISSION_ENTITIES)[number]
export type Action = (typeof PERMISSION_ACTIONS)[number]
// `scope` is optional in the type so every other entity's literal `{ entity, action }` keeps
// working untouched; a stored grant always carries one (the empty string for an unscoped entity).
export type Permission = { entity: Entity; action: Action; scope?: string }

// Featured Images are immutable: normalizing happens once on upload, so replacing
// one means deleting and uploading again — there is no update to authorize.
// Atas are never deleted: administrative numbering must not gain gaps from removal.
const ENTITY_ACTIONS: Record<Entity, readonly Action[]> = {
  bulletins: PERMISSION_ACTIONS,
  articles: PERMISSION_ACTIONS,
  liturgies: PERMISSION_ACTIONS,
  announcements: PERMISSION_ACTIONS,
  songs: PERMISSION_ACTIONS,
  members: PERMISSION_ACTIONS,
  agenda: PERMISSION_ACTIONS,
  users: PERMISSION_ACTIONS,
  featured_images: ['read', 'create', 'delete'],
  meeting_minutes: ['read', 'create', 'update'],
}

export function actionsFor(entity: Entity): readonly Action[] {
  return ENTITY_ACTIONS[entity]
}

// A Livro is a scope of the Ata entity, not an entity of its own: one enum value, one row per
// (entidade, Livro) in the catalog, so the entity/action vocabulary never has to grow.
const NO_SCOPE = [''] as const

const ENTITY_SCOPES: Record<Entity, readonly string[]> = {
  bulletins: NO_SCOPE,
  articles: NO_SCOPE,
  liturgies: NO_SCOPE,
  announcements: NO_SCOPE,
  songs: NO_SCOPE,
  members: NO_SCOPE,
  agenda: NO_SCOPE,
  users: NO_SCOPE,
  featured_images: NO_SCOPE,
  meeting_minutes: MEETING_MINUTE_BOOK_SLUGS,
}

export function scopesFor(entity: Entity): readonly string[] {
  return ENTITY_SCOPES[entity]
}

export const PERMISSION_CATALOG = PERMISSION_ENTITIES.flatMap((entity) =>
  actionsFor(entity).flatMap((action) => scopesFor(entity).map((scope) => ({ entity, action, scope })))
) satisfies Permission[]

// A missing `scope` means "any scope of this entity" — the shape coarse checks (nav visibility,
// page guards for entities with no scope) want. A pair×scope check always passes an explicit
// scope, `''` included, so it never matches loosely.
export function isDeclaredPermission(entity: Entity, action: Action, scope?: string): boolean {
  if (!actionsFor(entity).includes(action)) return false
  return scope === undefined || scopesFor(entity).includes(scope)
}

export const USER_MANAGEMENT_PERMISSIONS: Permission[] = [
  { entity: 'users', action: 'read' },
  { entity: 'users', action: 'update' },
]

// A stored grant is never trusted on its own: rows survive a catalog change (and a
// mixed-version deploy can write one back), so an undeclared pair must not authorize.
// A grant with no scope for a Livro entity never authorizes either — the same principle
// extended to the third dimension: a row a deploy left behind must not turn into access.
export function can(permissions: readonly Permission[], entity: Entity, action: Action, scope?: string): boolean {
  if (!isDeclaredPermission(entity, action, scope)) return false

  return permissions.some(
    (permission) =>
      permission.entity === entity &&
      permission.action === action &&
      (scope === undefined || (permission.scope ?? '') === scope)
  )
}
