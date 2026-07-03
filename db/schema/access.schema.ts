import { integer, pgEnum, pgTable, text, unique } from 'drizzle-orm/pg-core'
import { id, timestamps } from './common-fields'

export const userStatus = pgEnum('user_status', ['pending', 'active', 'disabled'])

export const permissionEntity = pgEnum('entity', [
  'bulletins',
  'articles',
  'liturgies',
  'announcements',
  'songs',
  'members',
  'agenda',
  'users',
])

export const permissionAction = pgEnum('action', ['read', 'create', 'update', 'delete'])

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
