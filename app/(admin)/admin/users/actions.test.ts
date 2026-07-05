import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { userPermissions, users } from '@/db/schema'
import type { CurrentUser } from '@/lib/auth/current-user'
import { createTestDb, type TestDb } from '@/tests/db'
import { seedUsers } from '@/tests/seed'
import {
  cancelInviteAction,
  createInviteAction,
  disableUserAction,
  reactivateUserAction,
  updateUserAction,
} from './actions'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

function formData(entries: [string, string][]) {
  const data = new FormData()
  for (const [name, value] of entries) data.append(name, value)
  return data
}

function inviteForm(overrides: [string, string][] = []) {
  return formData([
    ['email', ' NOVO@Example.com '],
    ['name', ' Novo '],
    ['permissions', 'articles:create'],
    ...overrides,
  ])
}

function userForm(userId: number, permissions: string[] = ['users:update']) {
  return formData([
    ['id', String(userId)],
    ['name', ' Atualizado '],
    ...permissions.map((permission) => ['permissions', permission] as [string, string]),
  ])
}

function idForm(id: number) {
  return formData([['id', String(id)]])
}

function currentUser(id: number, canReturn: boolean): CurrentUser {
  return {
    id,
    email: 'admin@example.com',
    name: 'Admin',
    can: vi.fn(() => canReturn),
  }
}

async function permissionsFor(db: TestDb, userId: number) {
  return db
    .select({ entity: userPermissions.entity, action: userPermissions.action })
    .from(userPermissions)
    .where(eq(userPermissions.user_id, userId))
}

describe('createInviteAction.execute', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
    vi.mocked(revalidatePath).mockClear()
  })

  it('denies forged requests without users:create permission', async () => {
    const user = currentUser(1, false)

    const state = await createInviteAction.execute({ user, db }, inviteForm())

    expect(state).toEqual({
      status: 'error',
      formError: 'Você não tem permissão para executar esta ação.',
    })
    expect(user.can).toHaveBeenCalledWith('users', 'create')
    expect(await db.select().from(users)).toEqual([])
  })

  it('creates a pending invite with normalized email and read implied by write permissions', async () => {
    const state = await createInviteAction.execute({ user: currentUser(1, true), db }, inviteForm())

    expect(state).toEqual({ status: 'success' })
    const [row] = await db.select().from(users).where(eq(users.email, 'novo@example.com'))
    expect(row).toMatchObject({ name: 'Novo', status: 'pending' })
    await expect(permissionsFor(db, row.id)).resolves.toEqual([
      { entity: 'articles', action: 'read' },
      { entity: 'articles', action: 'create' },
    ])
    expect(revalidatePath).toHaveBeenCalledWith('/admin/users')
  })

  it('requires at least one permission', async () => {
    const state = await createInviteAction.execute(
      { user: currentUser(1, true), db },
      formData([
        ['email', 'novo@example.com'],
        ['name', 'Novo'],
      ])
    )

    expect(state).toEqual({
      status: 'error',
      fieldErrors: { permissions: ['Escolha ao menos uma permissão.'] },
    })
    expect(await db.select().from(users)).toEqual([])
  })

  it.each([
    ['active', 'Esse e-mail já é um Usuário.'],
    ['disabled', 'Esse e-mail pertence a um Usuário desabilitado — use Reativar.'],
    ['pending', 'Já existe um Convite pendente para esse e-mail — edite o Convite existente.'],
  ] as const)('rejects duplicate %s emails with state-specific copy', async (status, message) => {
    await seedUsers(db, [{ email: 'novo@example.com', status }])

    const state = await createInviteAction.execute({ user: currentUser(1, true), db }, inviteForm())

    expect(state).toEqual({ status: 'error', formError: message })
  })

  it('rejects duplicates after trimming and lowercasing existing emails', async () => {
    await seedUsers(db, [{ email: ' NOVO@example.com ', status: 'active' }])

    const state = await createInviteAction.execute({ user: currentUser(1, true), db }, inviteForm())

    expect(state).toEqual({ status: 'error', formError: 'Esse e-mail já é um Usuário.' })
  })
})

describe('updateUserAction.execute', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
    vi.mocked(revalidatePath).mockClear()
  })

  it('denies forged requests without users:update permission', async () => {
    const [target] = await seedUsers(db, [{ email: 'target@example.com', name: 'Antigo' }])
    const user = currentUser(999, false)

    const state = await updateUserAction.execute({ user, db }, userForm(target, ['songs:read']))

    expect(state).toEqual({
      status: 'error',
      formError: 'Você não tem permissão para executar esta ação.',
    })
    expect(user.can).toHaveBeenCalledWith('users', 'update')
    const [row] = await db.select({ name: users.name }).from(users).where(eq(users.id, target))
    expect(row.name).toBe('Antigo')
  })

  it('updates name and replaces permissions with server-side read implication', async () => {
    const [target] = await seedUsers(db, [{ email: 'target@example.com', name: 'Antigo' }])
    await db.insert(userPermissions).values({ user_id: target, entity: 'articles', action: 'read' })

    const state = await updateUserAction.execute(
      { user: currentUser(999, true), db },
      userForm(target, ['songs:delete'])
    )

    expect(state).toEqual({ status: 'success' })
    const [row] = await db.select().from(users).where(eq(users.id, target))
    expect(row.name).toBe('Atualizado')
    await expect(permissionsFor(db, target)).resolves.toEqual([
      { entity: 'songs', action: 'read' },
      { entity: 'songs', action: 'delete' },
    ])
  })

  it('blocks removing own users read/update permissions', async () => {
    const [self] = await seedUsers(db, [{ email: 'admin@example.com' }])

    const state = await updateUserAction.execute({ user: currentUser(self, true), db }, userForm(self, ['users:read']))

    expect(state).toEqual({
      status: 'error',
      formError: 'Você não pode retirar de si a gestão de Usuários nem se desabilitar.',
    })
  })
})

describe('status and invite actions', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
    vi.mocked(revalidatePath).mockClear()
  })

  it('denies status changes without users:update permission', async () => {
    const [target] = await seedUsers(db, [{ email: 'target@example.com', status: 'active' }])
    const user = currentUser(999, false)

    const state = await disableUserAction.execute({ user, db }, idForm(target))

    expect(state).toEqual({
      status: 'error',
      formError: 'Você não tem permissão para executar esta ação.',
    })
    expect(user.can).toHaveBeenCalledWith('users', 'update')
    const [row] = await db.select({ status: users.status }).from(users).where(eq(users.id, target))
    expect(row.status).toBe('active')
  })

  it('denies invite cancellation without users:delete permission', async () => {
    const [pending] = await seedUsers(db, [{ email: 'pending@example.com', status: 'pending' }])
    const user = currentUser(999, false)

    const state = await cancelInviteAction.execute({ user, db }, idForm(pending))

    expect(state).toEqual({
      status: 'error',
      formError: 'Você não tem permissão para executar esta ação.',
    })
    expect(user.can).toHaveBeenCalledWith('users', 'delete')
    expect(await db.select().from(users).where(eq(users.id, pending))).toHaveLength(1)
  })

  it('disables and reactivates active users while preserving permissions', async () => {
    const [target] = await seedUsers(db, [{ email: 'target@example.com', status: 'active' }])
    await db.insert(userPermissions).values({ user_id: target, entity: 'articles', action: 'read' })

    await expect(disableUserAction.execute({ user: currentUser(999, true), db }, idForm(target))).resolves.toEqual({
      status: 'success',
    })
    let [row] = await db.select({ status: users.status }).from(users).where(eq(users.id, target))
    expect(row.status).toBe('disabled')

    await expect(reactivateUserAction.execute({ user: currentUser(999, true), db }, idForm(target))).resolves.toEqual({
      status: 'success',
    })
    ;[row] = await db.select({ status: users.status }).from(users).where(eq(users.id, target))
    expect(row.status).toBe('active')
    await expect(permissionsFor(db, target)).resolves.toEqual([{ entity: 'articles', action: 'read' }])
  })

  it('blocks self-disable on the server', async () => {
    const [self] = await seedUsers(db, [{ email: 'admin@example.com', status: 'active' }])

    const state = await disableUserAction.execute({ user: currentUser(self, true), db }, idForm(self))

    expect(state).toEqual({
      status: 'error',
      formError: 'Você não pode retirar de si a gestão de Usuários nem se desabilitar.',
    })
    const [row] = await db.select({ status: users.status }).from(users).where(eq(users.id, self))
    expect(row.status).toBe('active')
  })

  it('hard-deletes only pending invites', async () => {
    const [pending, active] = await seedUsers(db, [
      { email: 'pending@example.com', status: 'pending' },
      { email: 'active@example.com', status: 'active' },
    ])

    await expect(cancelInviteAction.execute({ user: currentUser(1, true), db }, idForm(pending))).resolves.toEqual({
      status: 'success',
    })
    expect(await db.select().from(users).where(eq(users.id, pending))).toEqual([])

    await expect(cancelInviteAction.execute({ user: currentUser(1, true), db }, idForm(active))).resolves.toEqual({
      status: 'error',
      formError: 'Não foi possível concluir a ação.',
    })
    expect(await db.select().from(users).where(eq(users.id, active))).toHaveLength(1)
  })
})
