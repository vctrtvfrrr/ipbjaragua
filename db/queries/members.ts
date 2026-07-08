import { and, asc, eq, isNull, sql } from 'drizzle-orm'
import { db as defaultDb, type Database } from '@/db'
import { members } from '@/db/schema'

export type Member = typeof members.$inferSelect
export type MemberStatus = Member['status']

export type MemberInput = {
  full_name: string
  sex: string | null
  mother: string | null
  father: string | null
  birth_date: Date | null
  birth_place: string | null
  marital_status: string | null
  wedding_date: Date | null
  spouse: string | null
  phone: string | null
  email: string | null
  address_street: string | null
  address_number: string | null
  address_complement: string | null
  nationality: string | null
  education: string | null
  profession: string | null
  home_church: string | null
  baptism_year: number | null
  baptism_place: string | null
  prof_faith_year: number | null
  prof_faith_place: string | null
  member_since: Date | null
  member_until: Date | null
  status: MemberStatus
}

export type PublicMemberInput = Omit<MemberInput, 'sex' | 'member_since' | 'member_until' | 'status'>

export class MemberNotFoundError extends Error {
  constructor(id: number) {
    super(`Member ${id} was not found`)
    this.name = 'MemberNotFoundError'
  }
}

export async function listMembersForAdmin(db: Database = defaultDb): Promise<Member[]> {
  return db.select().from(members).where(isNull(members.deleted_at)).orderBy(asc(members.full_name), asc(members.id))
}

export async function getMemberById(id: number, db: Database = defaultDb): Promise<Member | undefined> {
  const rows = await db
    .select()
    .from(members)
    .where(and(eq(members.id, id), isNull(members.deleted_at)))
    .limit(1)
  return rows[0]
}

export async function createMember(input: MemberInput, db: Database = defaultDb): Promise<Member> {
  const [member] = await db.insert(members).values(input).returning()
  return member
}

export async function createPendingMember(input: PublicMemberInput, db: Database = defaultDb): Promise<Member> {
  return createMember({ ...input, sex: null, member_since: null, member_until: null, status: 'pending' }, db)
}

export async function updateMember(id: number, input: MemberInput, db: Database = defaultDb): Promise<Member> {
  const [member] = await db
    .update(members)
    .set(input)
    .where(and(eq(members.id, id), isNull(members.deleted_at)))
    .returning()

  if (!member) throw new MemberNotFoundError(id)
  return member
}

export async function softDeleteMember(id: number, db: Database = defaultDb): Promise<Member> {
  const [member] = await db
    .update(members)
    .set({ deleted_at: sql`CURRENT_TIMESTAMP` })
    .where(and(eq(members.id, id), isNull(members.deleted_at)))
    .returning()

  if (!member) throw new MemberNotFoundError(id)
  return member
}
