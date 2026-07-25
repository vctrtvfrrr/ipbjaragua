import type { CurrentUser } from '@/lib/auth/current-user'

export type LiturgyVisibility = 'published-only' | 'include-drafts'

export function liturgyVisibilityForUser(user: CurrentUser | null): LiturgyVisibility {
  return user?.can('liturgies', 'read') ? 'include-drafts' : 'published-only'
}
