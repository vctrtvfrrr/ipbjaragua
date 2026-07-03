import { sql } from 'drizzle-orm'
import { z } from 'zod'
import type { Database } from '@/db'
import { userPermissions, users } from '@/db/schema'
import type { TestDb } from '@/tests/db'

const googleProfileSchema = z.object({
  email: z.string().trim().toLowerCase(),
  email_verified: z.literal(true),
})

export type GoogleLoginResult = { ok: true; userId: number } | { ok: false; reason: string }

// Keeps the decision logic injectable across postgres-js in runtime and PGlite in tests.
type AuthDb = Database | TestDb

export function normalizeGoogleEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function resolveGoogleLogin(db: AuthDb, profile: unknown): Promise<GoogleLoginResult> {
  const parsed = googleProfileSchema.safeParse(profile)

  if (!parsed.success) {
    return { ok: false, reason: 'unverified_or_invalid_profile' }
  }

  const email = normalizeGoogleEmail(parsed.data.email)
  const [user] = await db
    .select({ id: users.id, status: users.status })
    .from(users)
    .where(sql`lower(trim(${users.email})) = ${email}`)
    .limit(1)

  if (!user) return { ok: false, reason: 'not_allowlisted' }
  if (user.status === 'disabled') return { ok: false, reason: 'disabled' }

  if (user.status === 'pending') {
    await db
      .update(users)
      .set({ status: 'active' })
      .where(sql`${users.id} = ${user.id}`)
  }

  return { ok: true, userId: user.id }
}

export async function grantAllPermissions(db: AuthDb, userId: number) {
  await db.execute(sql`
    INSERT INTO ${userPermissions} (user_id, entity, action)
    SELECT ${userId}, e.entity, a.action
    FROM unnest(enum_range(NULL::entity)) AS e(entity)
    CROSS JOIN unnest(enum_range(NULL::action)) AS a(action)
  `)
}
