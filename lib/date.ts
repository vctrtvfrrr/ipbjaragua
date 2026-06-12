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
