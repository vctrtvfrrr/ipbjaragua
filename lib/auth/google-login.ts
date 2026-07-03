import { sql } from 'drizzle-orm'
import { z } from 'zod'
import type { Database } from '@/db'
import { users } from '@/db/schema'

const googleProfileSchema = z.object({
  email: z.string().trim().toLowerCase(),
  email_verified: z.literal(true),
})

export type GoogleLoginResult = { ok: true; userId: number } | { ok: false; reason: string }

export async function resolveGoogleLogin(db: Database, profile: unknown): Promise<GoogleLoginResult> {
  const parsed = googleProfileSchema.safeParse(profile)

  if (!parsed.success) {
    return { ok: false, reason: 'unverified_or_invalid_profile' }
  }

  const email = parsed.data.email
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
      .set({ status: 'active', updated_at: sql`now()` })
      .where(sql`${users.id} = ${user.id}`)
  }

  return { ok: true, userId: user.id }
}
