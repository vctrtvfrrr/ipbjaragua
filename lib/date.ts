export function parseISODate(value: string): Date {
  return new Date(`${value}T00:00:00Z`)
}

export function formatISODate(value: Date): string {
  return value.toISOString().slice(0, 10)
}

export function todayISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
}

export function today(): Date {
  return parseISODate(todayISO())
}

export function currentTimeHHMM(): string {
  const parts = new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Sao_Paulo',
  }).formatToParts(new Date())
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
