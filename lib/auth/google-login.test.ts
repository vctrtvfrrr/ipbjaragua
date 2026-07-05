import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { users } from '@/db/schema'
import { createTestDb, type TestDb } from '@/tests/db'
import { resolveGoogleLogin } from './google-login'

describe('Google login decision', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
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

  it('backfills an empty name from Google on first login', async () => {
    const [user] = await db
      .insert(users)
      .values({ email: 'ana@example.com', name: null, status: 'pending' })
      .returning({ id: users.id })

    await expect(
      resolveGoogleLogin(db, { email: 'ana@example.com', email_verified: true, name: 'Ana Silva' })
    ).resolves.toEqual({
      ok: true,
      userId: user.id,
    })

    const [row] = await db.select({ status: users.status, name: users.name }).from(users).where(eq(users.id, user.id))
    expect(row).toEqual({ status: 'active', name: 'Ana Silva' })
  })

  it('does not overwrite an existing name from Google login', async () => {
    const [user] = await db
      .insert(users)
      .values({ email: 'ana@example.com', name: 'Ana Admin', status: 'active' })
      .returning({ id: users.id })

    await expect(
      resolveGoogleLogin(db, { email: 'ana@example.com', email_verified: true, name: 'Ana Google' })
    ).resolves.toEqual({
      ok: true,
      userId: user.id,
    })

    const [row] = await db.select({ name: users.name }).from(users).where(eq(users.id, user.id))
    expect(row.name).toBe('Ana Admin')
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
})
