import { and, asc, gte, isNull } from 'drizzle-orm'
import { db as defaultDb, type Database } from '@/db'
import { formatCoupleLabel } from '@/lib/bulletin'
import { formatWeekdayPtBR } from '@/lib/date'
import { agenda, announcements, members } from '@/db/schema'

export type AgendaEntry = typeof agenda.$inferSelect & { resolvedDate: string }

export async function listAgendaInWindow(from: string, to: string, db: Database = defaultDb): Promise<AgendaEntry[]> {
  const rows = await db.select().from(agenda).where(isNull(agenda.deleted_at))

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
}

export type AnniversaryDay = { md: string; weekday: string; names: string[] }

export async function listAnniversariesInWindow(
  from: string,
  to: string,
  db: Database = defaultDb
): Promise<AnniversaryDay[]> {
  const rows = await db.select().from(members).where(isNull(members.deleted_at))
  const active = rows.filter((m) => m.status === 'active')

  const fromMD = mdOf(from)
  const toMD = mdOf(to)
  const wraps = fromMD > toMD
  const fromYear = from.slice(0, 4)
  const toYear = to.slice(0, 4)

  const inMDWindow = (md: string) => (wraps ? md >= fromMD || md <= toMD : md >= fromMD && md <= toMD)

  const resolveYear = (mmdd: string) => (!wraps || mmdd >= fromMD ? fromYear : toYear)

  type Entry = { mmdd: string; rank: number; name: string }
  const entries: Entry[] = []

  for (const m of active) {
    if (!m.birth_date) continue
    const mmdd = m.birth_date.slice(5)
    if (inMDWindow(mmdd)) entries.push({ mmdd, rank: 0, name: m.full_name })
  }

  const withWedding = active.filter((m) => m.wedding_date && m.spouse)
  const seen = new Set<string>()

  for (const a of withWedding) {
    const b = withWedding.find(
      (m) =>
        m.id !== a.id && normalizeName(m.full_name) === normalizeName(a.spouse!) && m.wedding_date === a.wedding_date
    )
    if (!b) continue
    const pairKey = [Math.min(a.id, b.id), Math.max(a.id, b.id)].join('-')
    if (seen.has(pairKey)) continue
    seen.add(pairKey)

    const wmd = a.wedding_date!.slice(5)
    if (!inMDWindow(wmd)) continue

    entries.push({ mmdd: wmd, rank: 1, name: formatCoupleLabel(a, b) })
  }

  entries.sort((a, b) => {
    if (a.mmdd !== b.mmdd) {
      if (!wraps) return a.mmdd < b.mmdd ? -1 : 1
      const aLate = a.mmdd >= fromMD
      const bLate = b.mmdd >= fromMD
      if (aLate !== bLate) return aLate ? -1 : 1
      return a.mmdd < b.mmdd ? -1 : 1
    }
    return a.rank - b.rank
  })

  const days: AnniversaryDay[] = []
  for (const entry of entries) {
    const md = formatMD(entry.mmdd)
    if (days.length > 0 && days[days.length - 1].md === md) {
      days[days.length - 1].names.push(entry.name)
    } else {
      const date = `${resolveYear(entry.mmdd)}-${entry.mmdd}`
      days.push({ md, weekday: formatWeekdayPtBR(date), names: [entry.name] })
    }
  }

  return days
}

function mdOf(date: string): string {
  return date.slice(5, 7) + '-' + date.slice(8, 10)
}

function formatMD(mmdd: string): string {
  return `${mmdd.slice(3, 5)}/${mmdd.slice(0, 2)}`
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

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

function dayOfWeek(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay()
}
