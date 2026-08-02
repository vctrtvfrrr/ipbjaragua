import { and, asc, count, desc, eq, isNotNull, isNull, lt, not, or, sql, type SQL } from 'drizzle-orm'
import { db as defaultDb, type Database } from '@/db'
import { agenda } from '@/db/schema'

export type AgendaItem = typeof agenda.$inferSelect

export type AgendaNow = { date: Date; time: string }

function isExpired(now: AgendaNow): SQL {
  return or(
    lt(agenda.event_date, now.date),
    and(eq(agenda.event_date, now.date), isNotNull(agenda.time), lt(agenda.time, now.time))
  )!
}

export class AgendaItemNotFoundError extends Error {
  constructor(id: number) {
    super(`Agenda item ${id} was not found`)
    this.name = 'AgendaItemNotFoundError'
  }
}

export type CreateAgendaItemInput = {
  title: string
  description: string | null
  event_date: Date
  time: string | null
}

export type UpdateAgendaItemInput = Partial<CreateAgendaItemInput>

export async function createAgendaItem(input: CreateAgendaItemInput, db: Database = defaultDb): Promise<AgendaItem> {
  const [item] = await db.insert(agenda).values(input).returning()
  return item
}

export async function updateAgendaItem(
  id: number,
  input: UpdateAgendaItemInput,
  db: Database = defaultDb
): Promise<AgendaItem> {
  const [item] = await db
    .update(agenda)
    .set(input)
    .where(and(eq(agenda.id, id), isNull(agenda.deleted_at)))
    .returning()

  if (!item) throw new AgendaItemNotFoundError(id)
  return item
}

export async function softDeleteAgendaItem(id: number, db: Database = defaultDb): Promise<AgendaItem> {
  const [item] = await db
    .update(agenda)
    .set({ deleted_at: sql`CURRENT_TIMESTAMP` })
    .where(and(eq(agenda.id, id), isNull(agenda.deleted_at)))
    .returning()

  if (!item) throw new AgendaItemNotFoundError(id)
  return item
}

export async function getAgendaItemById(id: number, db: Database = defaultDb): Promise<AgendaItem | undefined> {
  const rows = await db
    .select()
    .from(agenda)
    .where(and(eq(agenda.id, id), isNull(agenda.deleted_at)))
    .limit(1)
  return rows[0]
}

export async function listUpcomingAgendaItems(now: AgendaNow, db: Database = defaultDb): Promise<AgendaItem[]> {
  return db
    .select()
    .from(agenda)
    .where(and(isNull(agenda.deleted_at), not(isExpired(now))))
    .orderBy(asc(agenda.event_date), asc(agenda.time), asc(agenda.id))
}

export async function listPastAgendaItems(
  { now, page, pageSize }: { now: AgendaNow; page: number; pageSize: number },
  db: Database = defaultDb
): Promise<AgendaItem[]> {
  return db
    .select()
    .from(agenda)
    .where(and(isNull(agenda.deleted_at), isExpired(now)))
    .orderBy(desc(agenda.event_date), desc(agenda.time), desc(agenda.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
}

export async function countPastAgendaItems(now: AgendaNow, db: Database = defaultDb): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(agenda)
    .where(and(isNull(agenda.deleted_at), isExpired(now)))
  return row?.value ?? 0
}
