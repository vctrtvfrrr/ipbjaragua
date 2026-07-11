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
] as const

export const PERMISSION_ACTIONS = ['read', 'create', 'update', 'delete'] as const

export type Entity = (typeof PERMISSION_ENTITIES)[number]
export type Action = (typeof PERMISSION_ACTIONS)[number]
export type Permission = { entity: Entity; action: Action }

export const PERMISSION_CATALOG = PERMISSION_ENTITIES.flatMap((entity) =>
  PERMISSION_ACTIONS.map((action) => ({ entity, action }))
) satisfies Permission[]

// Floor a user can't strip from itself, so nobody locks themselves out of user management.
export const USER_MANAGEMENT_PERMISSIONS: Permission[] = [
  { entity: 'users', action: 'read' },
  { entity: 'users', action: 'update' },
]

export function can(permissions: readonly Permission[], entity: Entity, action: Action): boolean {
  return permissions.some((permission) => permission.entity === entity && permission.action === action)
}
