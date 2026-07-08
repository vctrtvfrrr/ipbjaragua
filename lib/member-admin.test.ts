import { describe, expect, it } from 'vitest'
import type { Member } from '@/db/queries/members'
import { filterMembersForAdmin, memberTabFor } from './member-admin'

function member(overrides: Partial<Member>): Member {
  return {
    id: overrides.id ?? 1,
    full_name: overrides.full_name ?? 'Ana Silva',
    sex: overrides.sex ?? null,
    mother: null,
    father: null,
    birth_date: overrides.birth_date ?? null,
    birth_place: null,
    marital_status: overrides.marital_status ?? null,
    wedding_date: overrides.wedding_date ?? null,
    spouse: null,
    phone: null,
    email: overrides.email ?? null,
    address_street: null,
    address_number: null,
    address_complement: null,
    nationality: null,
    education: null,
    profession: null,
    home_church: null,
    baptism_year: overrides.baptism_year ?? null,
    baptism_place: null,
    prof_faith_year: overrides.prof_faith_year ?? null,
    prof_faith_place: null,
    member_since: null,
    member_until: null,
    status: overrides.status ?? 'active',
    created_at: '',
    updated_at: '',
    deleted_at: null,
  }
}

describe('member admin tabs', () => {
  it('derives the four admin tabs from status and profession of faith', () => {
    expect(memberTabFor(member({ status: 'active', prof_faith_year: 2010 }))).toBe('communicant')
    expect(memberTabFor(member({ status: 'active', prof_faith_year: null }))).toBe('nonCommunicant')
    expect(memberTabFor(member({ status: 'transferred' }))).toBe('former')
    expect(memberTabFor(member({ status: 'pending' }))).toBe('pending')
  })

  it('filters former members by ecclesiastical status and sorts client-side', () => {
    const rows = [
      member({ id: 1, full_name: 'Zeca', status: 'removed', sex: 'Masculino' }),
      member({ id: 2, full_name: 'Ana', status: 'transferred', sex: 'Feminino' }),
      member({ id: 3, full_name: 'Bia', status: 'transferred', sex: 'Feminino' }),
      member({ id: 4, full_name: 'Eva', status: 'pending', sex: 'Feminino' }),
    ]

    expect(
      filterMembersForAdmin(rows, 'former', { sex: 'Feminino', status: 'transferred' }, 'full_name', 'desc').map(
        (row) => row.full_name
      )
    ).toEqual(['Bia', 'Ana'])
  })

  it('does not apply sex and marital status filters to pending members', () => {
    const rows = [
      member({ id: 1, full_name: 'Pendente A', status: 'pending', sex: null, marital_status: 'Solteiro(a)' }),
      member({ id: 2, full_name: 'Pendente B', status: 'pending', sex: null, marital_status: null }),
    ]

    expect(
      filterMembersForAdmin(rows, 'pending', { sex: 'Feminino', marital_status: 'Casado(a)' }, 'full_name', 'asc').map(
        (row) => row.full_name
      )
    ).toEqual(['Pendente A', 'Pendente B'])
  })
})
