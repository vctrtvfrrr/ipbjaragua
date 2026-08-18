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
export type Permission = { entity: Entity; action: Action }

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

export const PERMISSION_CATALOG = PERMISSION_ENTITIES.flatMap((entity) =>
  actionsFor(entity).map((action) => ({ entity, action }))
) satisfies Permission[]

export function isDeclaredPermission(entity: Entity, action: Action): boolean {
  return actionsFor(entity).includes(action)
}

export const USER_MANAGEMENT_PERMISSIONS: Permission[] = [
  { entity: 'users', action: 'read' },
  { entity: 'users', action: 'update' },
]

// A stored grant is never trusted on its own: rows survive a catalog change (and a
// mixed-version deploy can write one back), so an undeclared pair must not authorize.
export function can(permissions: readonly Permission[], entity: Entity, action: Action): boolean {
  if (!isDeclaredPermission(entity, action)) return false

  return permissions.some((permission) => permission.entity === entity && permission.action === action)
}
