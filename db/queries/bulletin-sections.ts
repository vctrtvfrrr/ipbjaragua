import { and, asc, gte, isNotNull, isNull } from 'drizzle-orm'
import { db as defaultDb } from '@/db'
import { agenda, announcements, members } from '@/db/schema'

type Database = typeof defaultDb

// Returns agenda items that fall within [from, to], each resolved to a concrete date.
// Recurring events resolve to the date of their weekday within the window (if it exists).
// One-off events resolve to their event_date if it's within [from, to].
export type AgendaEntry = typeof agenda.$inferSelect & { resolvedDate: string }

export async function listAgendaInWindow(from: string, to: string, db: Database = defaultDb): Promise<AgendaEntry[]> {
  const rows = db.select().from(agenda).where(isNull(agenda.deleted_at)).all()

  const window = datesInRange(from, to)

  const entries: AgendaEntry[] = []
  for (const row of rows) {
    if (row.is_recurring) {
      const match = window.find((d) => dayOfWeek(d) === row.weekday)
      if (match !== undefined) {
        entries.push({ ...row, resolvedDate: match })
      }
    } else {
      if (row.event_date && row.event_date >= from && row.event_date <= to) {
        entries.push({ ...row, resolvedDate: row.event_date })
      }
    }
  }

  entries.sort((a, b) => {
    const dateCmp = a.resolvedDate.localeCompare(b.resolvedDate)
    if (dateCmp !== 0) return dateCmp
    return (a.time ?? '').localeCompare(b.time ?? '')
  })

  return entries
}

export async function listActiveAnnouncements(
  asOf: string,
  db: Database = defaultDb
): Promise<(typeof announcements.$inferSelect)[]> {
  return db
    .select()
    .from(announcements)
    .where(and(isNull(announcements.deleted_at), gte(announcements.expires_at, asOf)))
    .orderBy(asc(announcements.expires_at))
    .all()
}

export async function listBirthdaysInWindow(
  from: string,
  to: string,
  db: Database = defaultDb
): Promise<(typeof members.$inferSelect)[]> {
  const rows = db
    .select()
    .from(members)
    .where(and(isNull(members.deleted_at), isNotNull(members.birth_date)))
    .all()

  const [fromMM, fromDD] = [from.slice(5, 7), from.slice(8, 10)]
  const [toMM, toDD] = [to.slice(5, 7), to.slice(8, 10)]
  const fromMD = `${fromMM}-${fromDD}`
  const toMD = `${toMM}-${toDD}`
  const wraps = fromMD > toMD // window crosses year boundary (e.g., Dec→Jan)

  const inWindow = rows.filter((m) => {
    if (!m.birth_date) return false
    const md = m.birth_date.slice(5) // MM-DD
    return wraps ? md >= fromMD || md <= toMD : md >= fromMD && md <= toMD
  })

  inWindow.sort((a, b) => {
    const aMD = a.birth_date!.slice(5)
    const bMD = b.birth_date!.slice(5)
    if (!wraps) return aMD < bMD ? -1 : 1
    // In a wrap window, dates >= fromMD come before dates <= toMD.
    const aInLate = aMD >= fromMD
    const bInLate = bMD >= fromMD
    if (aInLate !== bInLate) return aInLate ? -1 : 1
    return aMD < bMD ? -1 : 1
  })

  return inWindow.filter((m) => m.status === 'active')
}

// Returns all calendar dates in [from, to] as YYYY-MM-DD strings.
function datesInRange(from: string, to: string): string[] {
  const dates: string[] = []
  const start = new Date(`${from}T00:00:00Z`)
  const end = new Date(`${to}T00:00:00Z`)
  const cur = new Date(start)
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10))
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return dates
}

// Returns the day of week (0=Sun, 1=Mon, ..., 6=Sat) for a YYYY-MM-DD string.
function dayOfWeek(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay()
}
