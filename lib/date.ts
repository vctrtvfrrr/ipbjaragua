export function todayISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
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

export function formatLongDatePtBR(value: string): string {
  return longDateFormatter.format(new Date(`${value}T00:00:00Z`))
}

const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
})

export function formatShortDatePtBR(value: string): string {
  return shortDateFormatter.format(new Date(`${value}T00:00:00Z`))
}

const weekdayFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  timeZone: 'UTC',
})

export function formatWeekdayPtBR(value: string): string {
  const name = weekdayFormatter.format(new Date(`${value}T00:00:00Z`))
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export function weekdayOf(value: string): number {
  return new Date(`${value}T00:00:00Z`).getUTCDay()
}

export function currentWeekWindow(today: string): { from: string; to: string } {
  const d = new Date(`${today}T00:00:00Z`)
  const wd = d.getUTCDay()
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
