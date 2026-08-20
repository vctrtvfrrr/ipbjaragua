import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { cache } from 'react'
import type { Database } from '@/db'
import { userPermissions, users } from '@/db/schema'
import { db } from '@/db'
import { can, type Action, type Entity, type Permission } from '@/lib/authz'
import { SESSION_COOKIE_NAME, verifySessionToken } from './session'

export type CurrentUser = {
  id: number
  email: string
  name: string | null
  can: (entity: Entity, action: Action) => boolean
}

export async function getCurrentUserFromToken(
  authDb: Database,
  token: string | undefined
): Promise<CurrentUser | null> {
  if (!token) return null

  const session = await verifySessionToken(token)
  if (!session) return null

  const [user] = await authDb
    .select({ id: users.id, email: users.email, name: users.name, status: users.status })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1)

  if (!user || user.status !== 'active') return null

  const permissions = (await authDb
    .select({ entity: userPermissions.entity, action: userPermissions.action })
    .from(userPermissions)
    .where(eq(userPermissions.user_id, user.id))) satisfies Permission[]

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    can: (entity, action) => can(permissions, entity, action),
  }
}

// An operation that spans minutes cannot ask `getCurrentUser` again: it is memoized per
// request, so it would answer with the situation it read before the operation began.
export async function readCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies()
  return getCurrentUserFromToken(db, cookieStore.get(SESSION_COOKIE_NAME)?.value)
}

export const getCurrentUser = cache(readCurrentUser)
