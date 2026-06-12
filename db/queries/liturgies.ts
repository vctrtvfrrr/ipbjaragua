import { and, count, desc, eq, isNull, lte } from 'drizzle-orm'
import { db as defaultDb } from '@/db'
import { liturgyActs, liturgyMoments, liturgies } from '@/db/schema'

export type Liturgy = typeof liturgies.$inferSelect

type Database = typeof defaultDb

export type LiturgyListItem = {
  id: number
  date: string
  theme: string
  sermonDescription: string | null
  sermonSpeaker: string | null
}

export async function countLiturgies(
  { today }: { today: string },
  db: Database = defaultDb
): Promise<number> {
  const row = db
    .select({ value: count() })
    .from(liturgies)
    .where(and(isNull(liturgies.deleted_at), lte(liturgies.date, today)))
    .get()
  return row?.value ?? 0
}

export async function listLiturgies(
  { page, pageSize, today }: { page: number; pageSize: number; today: string },
  db: Database = defaultDb
): Promise<LiturgyListItem[]> {
  const rows = db
    .select({
      id: liturgies.id,
      date: liturgies.date,
      theme: liturgies.theme,
      sermonDescription: liturgyMoments.description,
      sermonSpeaker: liturgyMoments.sermon_speaker,
    })
    .from(liturgies)
    .leftJoin(liturgyActs, eq(liturgyActs.liturgy_id, liturgies.id))
    .leftJoin(
      liturgyMoments,
      and(eq(liturgyMoments.act_id, liturgyActs.id), eq(liturgyMoments.type, 'sermon'))
    )
    .where(and(isNull(liturgies.deleted_at), lte(liturgies.date, today)))
    .orderBy(desc(liturgies.date))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .all()

  // Deduplicate: keep first sermon moment found per liturgy (multiple acts may match).
  const seen = new Set<number>()
  const result: LiturgyListItem[] = []
  for (const row of rows) {
    if (!seen.has(row.id)) {
      seen.add(row.id)
      result.push({
        id: row.id,
        date: row.date,
        theme: row.theme,
        sermonDescription: row.sermonDescription ?? null,
        sermonSpeaker: row.sermonSpeaker ?? null,
      })
    }
  }
  return result
}
