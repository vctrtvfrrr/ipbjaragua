import { eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { members } from '@/db/schema'
import type { CurrentUser } from '@/lib/auth/current-user'
import { createTestDb, type TestDb } from '@/tests/db'
import { seedMembers } from '@/tests/seed'
import { createMemberAction, defineUpdateMemberAction, deleteMemberAction } from './actions'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

function formData(entries: [string, string][]) {
  const data = new FormData()
  for (const [name, value] of entries) data.append(name, value)
  return data
}

function memberForm(overrides: Partial<Record<string, string>> = {}) {
  return formData(
    Object.entries({
      email: 'membro@example.com',
      full_name: 'Membro Exemplo',
      birth_date: '1990-02-03',
      birth_place: 'Jaraguá',
      nationality: 'Brasileira',
      mother: 'Mãe',
      father: 'Pai',
      profession: 'Professor',
      education: 'Superior',
      marital_status: 'Solteiro(a)',
      spouse: '',
      wedding_date: '',
      address_street: 'Rua Um',
      address_number: '123',
      address_complement: '',
      phone: '11999999999',
      home_church: 'nenhuma',
      baptism_year: '',
      baptism_place: '',
      prof_faith_year: '',
      prof_faith_place: '',
      member_since: '',
      member_until: '',
      sex: 'Masculino',
      status: 'active',
      ...overrides,
    })
  )
}

function userWithPermission(canReturn: boolean): CurrentUser {
  return {
    id: 1,
    email: 'admin@example.com',
    name: 'Admin',
    can: vi.fn(() => canReturn),
  }
}

describe('member actions', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await createTestDb()
    vi.mocked(revalidatePath).mockClear()
  })

  it('denies create without member permission', async () => {
    const user = userWithPermission(false)

    const state = await createMemberAction.execute({ user, db }, memberForm())

    expect(state).toEqual({
      status: 'error',
      formError: 'Você não tem permissão para executar esta ação.',
    })
    expect(user.can).toHaveBeenCalledWith('members', 'create')
    expect(await db.select().from(members).where(isNull(members.deleted_at))).toEqual([])
  })

  it('requires sex when saving a non-pending member', async () => {
    const state = await createMemberAction.execute(
      { user: userWithPermission(true), db },
      memberForm({ sex: '', status: 'active' })
    )

    expect(state.status).toBe('error')
    if (state.status === 'error') {
      expect(state.fieldErrors?.sex).toEqual(['Sexo é obrigatório para status diferente de pendente'])
    }
    expect(await db.select().from(members).where(isNull(members.deleted_at))).toEqual([])
  })

  it('creates an active member with normalized empty fields', async () => {
    const state = await createMemberAction.execute({ user: userWithPermission(true), db }, memberForm())

    expect(state).toEqual({ status: 'success' })
    const rows = await db.select().from(members).where(eq(members.email, 'membro@example.com'))
    expect(rows[0]).toMatchObject({
      status: 'active',
      full_name: 'Membro Exemplo',
      spouse: null,
      baptism_year: null,
    })
    expect(revalidatePath).toHaveBeenCalledWith('/admin/members')
    expect(revalidatePath).toHaveBeenCalledWith('/bulletins/[date]', 'page')
  })

  it('promotes pending to active and sends the opt-in email only for that transition', async () => {
    await seedMembers(db, [{ full_name: 'Pendente', status: 'pending', email: 'p@example.com' }])
    const [pending] = await db.select().from(members).where(eq(members.full_name, 'Pendente'))
    const sendMail = vi.fn().mockResolvedValue(undefined)
    const action = defineUpdateMemberAction({
      env: { RESEND_API_KEY: 're_key', EMAIL_FROM: 'IPB <no-reply@example.com>' },
      sendMail,
    })
    const form = memberForm({
      id: String(pending.id),
      email: 'p@example.com',
      full_name: 'Pendente',
      status: 'active',
      sex: 'Feminino',
      notify_promotion: 'on',
    })

    const state = await action.execute({ user: userWithPermission(true), db }, form)

    expect(state).toEqual({ status: 'success' })
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'p@example.com',
        subject: 'Seu cadastro de membro foi revisado',
      }),
      expect.anything()
    )
  })

  it('denies update without member permission', async () => {
    await seedMembers(db, [{ full_name: 'Ativo', status: 'active', sex: 'Masculino' }])
    const [active] = await db.select().from(members).where(eq(members.full_name, 'Ativo'))
    const user = userWithPermission(false)

    const state = await defineUpdateMemberAction().execute(
      { user, db },
      memberForm({ id: String(active.id), full_name: 'Alterado' })
    )

    expect(state).toEqual({
      status: 'error',
      formError: 'Você não tem permissão para executar esta ação.',
    })
    expect(user.can).toHaveBeenCalledWith('members', 'update')
    const [row] = await db.select().from(members).where(eq(members.id, active.id))
    expect(row.full_name).toBe('Ativo')
  })

  it('rejects manual transition from active back to pending', async () => {
    await seedMembers(db, [{ full_name: 'Ativo', status: 'active', sex: 'Masculino' }])
    const [active] = await db.select().from(members).where(eq(members.full_name, 'Ativo'))

    const state = await defineUpdateMemberAction().execute(
      { user: userWithPermission(true), db },
      memberForm({ id: String(active.id), full_name: 'Ativo', status: 'pending', sex: '' })
    )

    expect(state).toEqual({
      status: 'error',
      formError: 'Somente cadastros públicos pendentes podem permanecer como pendentes.',
    })
    const [row] = await db.select().from(members).where(eq(members.id, active.id))
    expect(row.status).toBe('active')
  })

  it('soft-deletes members without using status removed', async () => {
    await seedMembers(db, [{ full_name: 'Duplicado', status: 'active' }])
    const [member] = await db.select().from(members).where(eq(members.full_name, 'Duplicado'))

    const state = await deleteMemberAction.execute(
      { user: userWithPermission(true), db },
      formData([['id', String(member.id)]])
    )

    expect(state).toEqual({ status: 'success' })
    const [row] = await db.select().from(members).where(eq(members.id, member.id))
    expect(row.status).toBe('active')
    expect(row.deleted_at).not.toBeNull()
  })

  it('denies delete without member permission', async () => {
    await seedMembers(db, [{ full_name: 'Protegido', status: 'active' }])
    const [member] = await db.select().from(members).where(eq(members.full_name, 'Protegido'))
    const user = userWithPermission(false)

    const state = await deleteMemberAction.execute({ user, db }, formData([['id', String(member.id)]]))

    expect(state).toEqual({
      status: 'error',
      formError: 'Você não tem permissão para executar esta ação.',
    })
    expect(user.can).toHaveBeenCalledWith('members', 'delete')
    const [row] = await db.select().from(members).where(eq(members.id, member.id))
    expect(row.deleted_at).toBeNull()
  })
})
