import type { Member } from '@/db/queries/members'

export const MEMBER_TABS = ['communicant', 'nonCommunicant', 'former', 'pending'] as const
export type MemberTab = (typeof MEMBER_TABS)[number]

export type MemberSortKey =
  | 'email'
  | 'full_name'
  | 'birth_date'
  | 'marital_status'
  | 'wedding_date'
  | 'baptism_year'
  | 'prof_faith_year'
  | 'status'

export type MemberSortDirection = 'asc' | 'desc'

export type MemberFilters = {
  sex?: string
  marital_status?: string
  status?: string
}

export function memberTabFor(member: Pick<Member, 'status' | 'prof_faith_year'>): MemberTab {
  if (member.status === 'pending') return 'pending'
  if (member.status !== 'active') return 'former'
  return member.prof_faith_year ? 'communicant' : 'nonCommunicant'
}

export function filterMembersForAdmin(
  members: Member[],
  tab: MemberTab,
  filters: MemberFilters,
  sortKey: MemberSortKey,
  direction: MemberSortDirection
): Member[] {
  return members
    .filter((member) => memberTabFor(member) === tab)
    .filter((member) => tab === 'pending' || !filters.sex || member.sex === filters.sex)
    .filter(
      (member) => tab === 'pending' || !filters.marital_status || member.marital_status === filters.marital_status
    )
    .filter((member) => tab !== 'former' || !filters.status || member.status === filters.status)
    .toSorted((a, b) => compareMembers(a, b, sortKey, direction))
}

export function countMembersByTab(members: Member[]): Record<MemberTab, number> {
  return {
    communicant: members.filter((member) => memberTabFor(member) === 'communicant').length,
    nonCommunicant: members.filter((member) => memberTabFor(member) === 'nonCommunicant').length,
    former: members.filter((member) => memberTabFor(member) === 'former').length,
    pending: members.filter((member) => memberTabFor(member) === 'pending').length,
  }
}

function compareMembers(a: Member, b: Member, sortKey: MemberSortKey, direction: MemberSortDirection): number {
  const modifier = direction === 'asc' ? 1 : -1
  const compared = compareNullable(valueFor(a, sortKey), valueFor(b, sortKey))
  return compared === 0 ? compareNullable(a.full_name, b.full_name) : compared * modifier
}

function valueFor(member: Member, key: MemberSortKey): string | number | null {
  const value = member[key]
  if (value instanceof Date) return value.toISOString()
  return value
}

function compareNullable(a: string | number | null, b: string | number | null): number {
  if (a === b) return 0
  if (a === null) return 1
  if (b === null) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), 'pt-BR', { sensitivity: 'base' })
}
