import type { MemberInput, PublicMemberInput } from '@/db/queries/members'

type ParsedBaseMemberInput = PublicMemberInput & {
  sex?: string | null
  member_since?: Date | null
  member_until?: Date | null
  status?: MemberInput['status']
}

export function publicMemberInputFrom(data: ParsedBaseMemberInput): PublicMemberInput {
  return {
    full_name: data.full_name,
    mother: data.mother,
    father: data.father,
    birth_date: data.birth_date,
    birth_place: data.birth_place,
    marital_status: data.marital_status,
    wedding_date: data.wedding_date,
    spouse: data.spouse,
    phone: data.phone,
    email: data.email,
    address_street: data.address_street,
    address_number: data.address_number,
    address_complement: data.address_complement,
    nationality: data.nationality,
    education: data.education,
    profession: data.profession,
    home_church: data.home_church,
    baptism_year: data.baptism_year,
    baptism_place: data.baptism_place,
    prof_faith_year: data.prof_faith_year,
    prof_faith_place: data.prof_faith_place,
  }
}

export function memberInputFrom(data: ParsedBaseMemberInput & Required<Pick<MemberInput, 'status'>>): MemberInput {
  return {
    ...publicMemberInputFrom(data),
    sex: data.sex ?? null,
    member_since: data.member_since ?? null,
    member_until: data.member_until ?? null,
    status: data.status,
  }
}
