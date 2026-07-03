import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { userPermissions, users } from '@/db/schema'
import { createTestDb, type TestDb } from '@/tests/db'
import { grantAllPermissions, normalizeGoogleEmail, resolveGoogleLogin } from './google-login'

describe('Google login decision', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
  })

  it('normalizes email with trim and lowercase only', () => {
    expect(normalizeGoogleEmail('  USER+Alias@Gmail.com  ')).toBe('user+alias@gmail.com')
  })

  it('denies unverified email with the generic denial result', async () => {
    await expect(resolveGoogleLogin(db, { email: 'ana@example.com', email_verified: false })).resolves.toMatchObject({
      ok: false,
    })
  })

  it('denies an email outside the allowlist', async () => {
    await expect(resolveGoogleLogin(db, { email: 'fora@example.com', email_verified: true })).resolves.toEqual({
      ok: false,
      reason: 'not_allowlisted',
    })
  })

  it('activates a pending user on the first matching login', async () => {
    const [user] = await db
      .insert(users)
      .values({ email: 'ana@example.com', name: 'Ana', status: 'pending' })
      .returning({ id: users.id })

    await expect(resolveGoogleLogin(db, { email: ' ANA@example.com ', email_verified: true })).resolves.toEqual({
      ok: true,
      userId: user.id,
    })

    const [row] = await db.select({ status: users.status, name: users.name }).from(users).where(eq(users.id, user.id))
    expect(row).toEqual({ status: 'active', name: 'Ana' })
  })

  it('emits a session for an already active user', async () => {
    const [user] = await db
      .insert(users)
      .values({ email: 'ana@example.com', name: 'Ana', status: 'active' })
      .returning({ id: users.id })

    await expect(resolveGoogleLogin(db, { email: 'ana@example.com', email_verified: true })).resolves.toEqual({
      ok: true,
      userId: user.id,
    })
  })

  it('denies a disabled user without reactivating it', async () => {
    const [user] = await db
      .insert(users)
      .values({ email: 'ana@example.com', name: 'Ana', status: 'disabled' })
      .returning({ id: users.id })

    await expect(resolveGoogleLogin(db, { email: 'ana@example.com', email_verified: true })).resolves.toEqual({
      ok: false,
      reason: 'disabled',
    })

    const [row] = await db.select({ status: users.status }).from(users).where(eq(users.id, user.id))
    expect(row.status).toBe('disabled')
  })

  it('can grant all 32 permissions from the database enums', async () => {
    const [user] = await db
      .insert(users)
      .values({ email: 'ana@example.com', status: 'active' })
      .returning({ id: users.id })

    await grantAllPermissions(db, user.id)

    const permissions = await db.select().from(userPermissions).where(eq(userPermissions.user_id, user.id))
    expect(permissions).toHaveLength(32)
  })
})
