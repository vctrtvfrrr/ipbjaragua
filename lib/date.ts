export const CHURCH_TIME_ZONE = 'America/Sao_Paulo'

export function parseISODate(value: string): Date {
  return new Date(`${value}T00:00:00Z`)
}

export function formatISODate(value: Date): string {
  return value.toISOString().slice(0, 10)
}

export function todayISO(at: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: CHURCH_TIME_ZONE }).format(at)
}

export function today(at: Date = new Date()): Date {
  return parseISODate(todayISO(at))
}

export function currentTimeHHMM(at: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: CHURCH_TIME_ZONE,
  }).formatToParts(at)
  const h = parts.find((p) => p.type === 'hour')!.value
  const m = parts.find((p) => p.type === 'minute')!.value
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
}

const longDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

export function formatLongDatePtBR(value: Date): string {
  return longDateFormatter.format(value)
}

const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
})

export function formatShortDatePtBR(value: Date): string {
  return shortDateFormatter.format(value)
}

const weekdayFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  timeZone: 'UTC',
})

export function formatWeekdayPtBR(value: Date): string {
  const name = weekdayFormatter.format(value)
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export function weekdayOf(value: Date): number {
  return value.getUTCDay()
}

export function currentWeekWindow(reference: Date): { from: Date; to: Date } {
  const wd = reference.getUTCDay()
  const daysSinceMonday = wd === 0 ? 6 : wd - 1
  const daysUntilSunday = wd === 0 ? 0 : 7 - wd
  const monday = new Date(reference)
  monday.setUTCDate(reference.getUTCDate() - daysSinceMonday)
  const sunday = new Date(reference)
  sunday.setUTCDate(reference.getUTCDate() + daysUntilSunday)
  return { from: monday, to: sunday }
}

export function nextWeekDateForWeekday(reference: Date, weekday: number): Date {
  const { from } = currentWeekWindow(reference)
  const nextWeekStart = new Date(from)
  nextWeekStart.setUTCDate(from.getUTCDate() + 7)

  const result = new Date(nextWeekStart)
  const offset = weekday === 0 ? 6 : weekday - 1
  result.setUTCDate(nextWeekStart.getUTCDate() + offset)
  return result
}

export type DateWindow = { from: Date; to: Date }

export function bulletinSectionWindows(date: Date): { agenda: DateWindow; birthdays: DateWindow } {
  const sunday = new Date(date)
  sunday.setUTCDate(date.getUTCDate() - date.getUTCDay())

  const birthdaysTo = new Date(sunday)
  birthdaysTo.setUTCDate(sunday.getUTCDate() + 6)

  const agendaFrom = new Date(sunday)
  agendaFrom.setUTCDate(sunday.getUTCDate() + 1)

  const agendaTo = new Date(sunday)
  agendaTo.setUTCDate(sunday.getUTCDate() + 7)

  return {
    agenda: { from: agendaFrom, to: agendaTo },
    birthdays: { from: sunday, to: birthdaysTo },
  }
}

const churchDateTimeParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: CHURCH_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

function churchWallClock(instant: Date): number {
  const parts = Object.fromEntries(churchDateTimeParts.formatToParts(instant).map((part) => [part.type, part.value]))
  return Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  )
}

// The civil time the operator types has no offset, so the instant is found by
// correcting a first guess with the offset the zone applies at that guess.
export function parseChurchDateTime(value: string): Date {
  const wallClock = Date.parse(`${value}:00Z`)
  if (Number.isNaN(wallClock)) return new Date(NaN)

  let instant = wallClock

  for (let attempt = 0; attempt < 2; attempt++) {
    instant = wallClock - (churchWallClock(new Date(instant)) - instant)
  }

  return new Date(instant)
}

export function formatChurchDateTimeInput(instant: Date): string {
  return new Date(churchWallClock(instant)).toISOString().slice(0, 16)
}

// A civil time only exists if reading the instant back yields it again: an impossible
// calendar day rolls over, and an hour skipped by a daylight saving jump lands before
// itself. An hour the zone repeats round-trips on both of its instants, and this keeps
// the earlier one.
export function isChurchDateTime(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return false

  const instant = parseChurchDateTime(value)
  return !Number.isNaN(instant.getTime()) && formatChurchDateTimeInput(instant) === value
}

export function churchYear(instant: Date): number {
  return new Date(churchWallClock(instant)).getUTCFullYear()
}

export function churchYearRange(year: number): { from: Date; to: Date } {
  return { from: parseChurchDateTime(`${year}-01-01T00:00`), to: parseChurchDateTime(`${year + 1}-01-01T00:00`) }
}

const churchDateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: CHURCH_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export function formatChurchDateTimePtBR(instant: Date): string {
  return churchDateTimeFormatter.format(instant)
}
