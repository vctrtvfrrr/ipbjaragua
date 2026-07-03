import { forbidden } from 'next/navigation'
import type { Entity } from '@/lib/authz'
import { type CurrentUser, getCurrentUser } from './current-user'

export function requirePageReadFor(user: CurrentUser | null, entity: Entity): CurrentUser {
  if (!user || !user.can(entity, 'read')) forbidden()
  return user
}

export async function requirePageRead(entity: Entity): Promise<CurrentUser> {
  return requirePageReadFor(await getCurrentUser(), entity)
}
