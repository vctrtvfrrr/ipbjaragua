export function parseISODate(value: string): Date {
  return new Date(`${value}T00:00:00Z`)
}

export function formatISODate(value: Date): string {
  return value.toISOString().slice(0, 10)
}

export function todayISO(at: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(at)
}

export function today(at: Date = new Date()): Date {
  return parseISODate(todayISO(at))
}

export function currentTimeHHMM(at: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Sao_Paulo',
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
