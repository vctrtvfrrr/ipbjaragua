import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { userPermissions, users } from '@/db/schema'
import { createTestDb, type TestDb } from '@/tests/db'
import { getCurrentUserFromToken } from './current-user'
import { createSessionToken } from './session'

const SECRET = 'a'.repeat(32)

describe('getCurrentUserFromToken', () => {
  let db: TestDb

  beforeEach(async () => {
    process.env.SESSION_SECRET = SECRET
    db = await createTestDb()
  })

  it('returns null for an absent or invalid session', async () => {
    await expect(getCurrentUserFromToken(db, undefined)).resolves.toBeNull()
    await expect(getCurrentUserFromToken(db, 'invalid')).resolves.toBeNull()
  })

  it('returns null when the user is missing or not active', async () => {
    const missingUserToken = await createSessionToken(999, SECRET)
    await expect(getCurrentUserFromToken(db, missingUserToken)).resolves.toBeNull()

    const [disabled] = await db
      .insert(users)
      .values({ email: 'disabled@example.com', status: 'disabled' })
      .returning({ id: users.id })
    const disabledToken = await createSessionToken(disabled.id, SECRET)

    await expect(getCurrentUserFromToken(db, disabledToken)).resolves.toBeNull()
  })

  it('loads the active user and exposes can() over its permissions', async () => {
    const [user] = await db
      .insert(users)
      .values({ email: 'ana@example.com', name: 'Ana', status: 'active' })
      .returning({ id: users.id })
    await db.insert(userPermissions).values({ user_id: user.id, entity: 'bulletins', action: 'read' })

    const currentUser = await getCurrentUserFromToken(db, await createSessionToken(user.id, SECRET))

    expect(currentUser).toMatchObject({ id: user.id, email: 'ana@example.com', name: 'Ana' })
    expect(currentUser?.can('bulletins', 'read')).toBe(true)
    expect(currentUser?.can('bulletins', 'delete')).toBe(false)
  })

  it('returns null after the user row is deleted', async () => {
    const [user] = await db
      .insert(users)
      .values({ email: 'ana@example.com', status: 'active' })
      .returning({ id: users.id })
    const token = await createSessionToken(user.id, SECRET)

    await db.delete(users).where(eq(users.id, user.id))

    await expect(getCurrentUserFromToken(db, token)).resolves.toBeNull()
  })
})
