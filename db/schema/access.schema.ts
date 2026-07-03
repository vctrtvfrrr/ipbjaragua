import { integer, pgEnum, pgTable, text, unique } from 'drizzle-orm/pg-core'
import { PERMISSION_ACTIONS, PERMISSION_ENTITIES } from '../../lib/authz'
import { id, timestamps } from './common-fields'

export const userStatus = pgEnum('user_status', ['pending', 'active', 'disabled'])

export const permissionEntity = pgEnum('permission_entity', PERMISSION_ENTITIES)

export const permissionAction = pgEnum('permission_action', PERMISSION_ACTIONS)

export const users = pgTable('users', {
  id: id(),
  email: text('email').notNull().unique(),
  name: text('name'),
  status: userStatus('status').notNull(),
  ...timestamps(),
})

export const userPermissions = pgTable(
  'user_permissions',
  {
    user_id: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    entity: permissionEntity('entity').notNull(),
    action: permissionAction('action').notNull(),
  },
  (t) => [unique('user_permissions_user_entity_action_unique').on(t.user_id, t.entity, t.action)]
)
