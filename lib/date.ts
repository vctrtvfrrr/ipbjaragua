// Returns today's date as YYYY-MM-DD in the America/Sao_Paulo timezone.
// Using en-CA locale with that timezone yields the ISO date directly.
export function todayISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
}

const longDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

// `value` is a date-only string (YYYY-MM-DD). Parsing it as UTC and formatting
// in UTC keeps the calendar day stable across server timezones.
export function formatLongDatePtBR(value: string): string {
  return longDateFormatter.format(new Date(`${value}T00:00:00Z`))
}

const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
})

// Formats a YYYY-MM-DD string as DD/MM.
export function formatShortDatePtBR(value: string): string {
  return shortDateFormatter.format(new Date(`${value}T00:00:00Z`))
}

const weekdayFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  timeZone: 'UTC',
})

// Formats a YYYY-MM-DD string as its capitalized weekday name (e.g. "Segunda-feira").
export function formatWeekdayPtBR(value: string): string {
  const name = weekdayFormatter.format(new Date(`${value}T00:00:00Z`))
  return name.charAt(0).toUpperCase() + name.slice(1)
}

// Day of week (0=Sun, 1=Mon, ..., 6=Sat) for a YYYY-MM-DD string.
export function weekdayOf(value: string): number {
  return new Date(`${value}T00:00:00Z`).getUTCDay()
}

// Returns the Monday→Sunday window containing the given date.
// Sunday is treated as the last day of the week (not the start of a new week).
export function currentWeekWindow(today: string): { from: string; to: string } {
  const d = new Date(`${today}T00:00:00Z`)
  const wd = d.getUTCDay() // 0=Sun, 1=Mon, ...6=Sat
  const daysSinceMonday = wd === 0 ? 6 : wd - 1
  const daysUntilSunday = wd === 0 ? 0 : 7 - wd
  const monday = new Date(d)
  monday.setUTCDate(d.getUTCDate() - daysSinceMonday)
  const sunday = new Date(d)
  sunday.setUTCDate(d.getUTCDate() + daysUntilSunday)
  return {
    from: monday.toISOString().slice(0, 10),
    to: sunday.toISOString().slice(0, 10),
  }
}
