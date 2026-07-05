import { asc, eq, inArray, sql } from 'drizzle-orm'
import { db as defaultDb, type Database } from '@/db'
import { userPermissions, users } from '@/db/schema'
import type { Permission } from '@/lib/authz'

export type UserStatus = typeof users.$inferSelect.status
export type User = typeof users.$inferSelect
export type UserWithPermissions = User & { permissions: Permission[] }

export type CreateInviteInput = {
  email: string
  name: string | null
  permissions: Permission[]
}

export type UpdateUserInput = {
  name: string | null
  permissions: Permission[]
}

export class UserEmailCollisionError extends Error {
  constructor(readonly status: UserStatus) {
    super(`User email already exists with status ${status}`)
    this.name = 'UserEmailCollisionError'
  }
}

export class UserNotFoundError extends Error {
  constructor(id: number) {
    super(`User ${id} was not found`)
    this.name = 'UserNotFoundError'
  }
}

export class InvalidUserStateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidUserStateError'
  }
}

export async function listUsers(db: Database = defaultDb): Promise<UserWithPermissions[]> {
  const rows = await db
    .select()
    .from(users)
    .orderBy(asc(sql`${users.name} is null`), asc(users.name), asc(users.email))
  return attachPermissions(rows, db)
}

export async function getUserById(id: number, db: Database = defaultDb): Promise<UserWithPermissions | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  if (!user) return undefined

  const [withPermissions] = await attachPermissions([user], db)
  return withPermissions
}

export async function createInvite(input: CreateInviteInput, db: Database = defaultDb): Promise<UserWithPermissions> {
  const [existing] = await db
    .select({ status: users.status })
    .from(users)
    .where(sql`lower(trim(${users.email})) = ${input.email}`)
    .limit(1)
  if (existing) throw new UserEmailCollisionError(existing.status)

  const [user] = await db.insert(users).values({ email: input.email, name: input.name, status: 'pending' }).returning()

  await replacePermissions(user.id, input.permissions, db)
  return { ...user, permissions: input.permissions }
}

export async function updateUserPermissions(
  id: number,
  input: UpdateUserInput,
  db: Database = defaultDb
): Promise<UserWithPermissions> {
  const [user] = await db.update(users).set({ name: input.name }).where(eq(users.id, id)).returning()
  if (!user) throw new UserNotFoundError(id)

  await replacePermissions(id, input.permissions, db)
  return { ...user, permissions: input.permissions }
}

export async function setUserStatus(
  id: number,
  status: Extract<UserStatus, 'active' | 'disabled'>,
  db: Database = defaultDb
): Promise<UserWithPermissions> {
  const [current] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  if (!current) throw new UserNotFoundError(id)

  if (current.status === 'pending') {
    throw new InvalidUserStateError('Pending users cannot be activated or disabled by status action')
  }

  const [user] = await db.update(users).set({ status }).where(eq(users.id, id)).returning()
  const [withPermissions] = await attachPermissions([user], db)
  return withPermissions
}

export async function deletePendingInvite(id: number, db: Database = defaultDb): Promise<User> {
  const [user] = await db
    .delete(users)
    .where(sql`${users.id} = ${id} and ${users.status} = 'pending'`)
    .returning()
  if (!user) throw new InvalidUserStateError('Only pending invites can be deleted')
  return user
}

async function attachPermissions<T extends User>(
  rows: T[],
  db: Database
): Promise<(T & { permissions: Permission[] })[]> {
  if (rows.length === 0) return []

  const permissions = await db
    .select({ user_id: userPermissions.user_id, entity: userPermissions.entity, action: userPermissions.action })
    .from(userPermissions)
    .where(
      inArray(
        userPermissions.user_id,
        rows.map((row) => row.id)
      )
    )

  return rows.map((row) => ({
    ...row,
    permissions: permissions
      .filter((permission) => permission.user_id === row.id)
      .map(({ entity, action }) => ({ entity, action })),
  }))
}

async function replacePermissions(userId: number, permissions: Permission[], db: Database): Promise<void> {
  await db.delete(userPermissions).where(eq(userPermissions.user_id, userId))

  if (permissions.length === 0) return

  await db.insert(userPermissions).values(
    permissions.map((permission) => ({
      user_id: userId,
      entity: permission.entity,
      action: permission.action,
    }))
  )
}
