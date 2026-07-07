import { and, asc, between, gte, isNull } from 'drizzle-orm'
import { db as defaultDb, type Database } from '@/db'
import { formatCoupleLabel } from '@/lib/bulletin'
import { formatWeekdayPtBR, parseISODate } from '@/lib/date'
import { agenda, announcements, members } from '@/db/schema'

export type AgendaEntry = typeof agenda.$inferSelect & { resolvedDate: Date }

export async function listAgendaInWindow(from: Date, to: Date, db: Database = defaultDb): Promise<AgendaEntry[]> {
  const rows = await db
    .select()
    .from(agenda)
    .where(and(isNull(agenda.deleted_at), between(agenda.event_date, from, to)))

  const entries = rows.map((row) => ({
    ...row,
    time: row.time ? row.time.slice(0, 5) : null,
    resolvedDate: row.event_date,
  }))

  entries.sort((a, b) => {
    const dateCmp = a.resolvedDate.getTime() - b.resolvedDate.getTime()
    if (dateCmp !== 0) return dateCmp
    return (a.time ?? '').localeCompare(b.time ?? '')
  })

  return entries
}

export async function listActiveAnnouncements(
  asOf: Date,
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
  from: Date,
  to: Date,
  db: Database = defaultDb
): Promise<AnniversaryDay[]> {
  const rows = await db.select().from(members).where(isNull(members.deleted_at))
  const active = rows.filter((m) => m.status === 'active')

  const fromMD = mdOf(from)
  const toMD = mdOf(to)
  const wraps = fromMD > toMD
  const fromYear = String(from.getUTCFullYear())
  const toYear = String(to.getUTCFullYear())

  const inMDWindow = (md: string) => (wraps ? md >= fromMD || md <= toMD : md >= fromMD && md <= toMD)

  const resolveYear = (mmdd: string) => (!wraps || mmdd >= fromMD ? fromYear : toYear)

  type Entry = { mmdd: string; rank: number; name: string }
  const entries: Entry[] = []

  for (const m of active) {
    if (!m.birth_date) continue
    const mmdd = mdOf(m.birth_date)
    if (inMDWindow(mmdd)) entries.push({ mmdd, rank: 0, name: m.full_name })
  }

  const withWedding = active.filter((m) => m.wedding_date && m.spouse)
  const seen = new Set<string>()

  for (const a of withWedding) {
    const b = withWedding.find(
      (m) =>
        m.id !== a.id &&
        normalizeName(m.full_name) === normalizeName(a.spouse!) &&
        m.wedding_date!.getTime() === a.wedding_date!.getTime()
    )
    if (!b) continue
    const pairKey = [Math.min(a.id, b.id), Math.max(a.id, b.id)].join('-')
    if (seen.has(pairKey)) continue
    seen.add(pairKey)

    const wmd = mdOf(a.wedding_date!)
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
      const date = parseISODate(`${resolveYear(entry.mmdd)}-${entry.mmdd}`)
      days.push({ md, weekday: formatWeekdayPtBR(date), names: [entry.name] })
    }
  }

  return days
}

function mdOf(date: Date): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${month}-${day}`
}

function formatMD(mmdd: string): string {
  return `${mmdd.slice(3, 5)}/${mmdd.slice(0, 2)}`
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}
