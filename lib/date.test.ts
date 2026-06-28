import { describe, expect, it } from 'vitest'
import {
  currentWeekWindow,
  formatISODate,
  formatLongDatePtBR,
  formatShortDatePtBR,
  formatWeekdayPtBR,
  parseISODate,
  todayISO,
} from './date'

describe('todayISO', () => {
  it('returns a YYYY-MM-DD string', () => {
    const result = todayISO()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('matches the current date in America/Sao_Paulo', () => {
    const spDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
    expect(todayISO()).toBe(spDate)
  })
})

describe('parseISODate / formatISODate', () => {
  it('round-trips an ISO date anchored at UTC midnight', () => {
    const d = parseISODate('2026-06-07')
    expect(d.getUTCHours()).toBe(0)
    expect(formatISODate(d)).toBe('2026-06-07')
  })
})

describe('currentWeekWindow', () => {
  const window = (iso: string) => {
    const { from, to } = currentWeekWindow(parseISODate(iso))
    return { from: formatISODate(from), to: formatISODate(to) }
  }

  it('returns Mon→Sun window for a Friday', () => {
    expect(window('2026-06-12')).toEqual({ from: '2026-06-08', to: '2026-06-14' })
  })

  it('returns Mon→Sun window when today is Monday', () => {
    expect(window('2026-06-08')).toEqual({ from: '2026-06-08', to: '2026-06-14' })
  })

  it('returns Mon→Sun window when today is Sunday (last day, not start of new week)', () => {
    expect(window('2026-06-14')).toEqual({ from: '2026-06-08', to: '2026-06-14' })
  })

  it('handles a week that spans month boundary', () => {
    expect(window('2026-06-30')).toEqual({ from: '2026-06-29', to: '2026-07-05' })
  })
})

describe('UTC-anchored formatting (no off-by-one)', () => {
  it('formats a date as a long pt-BR date keeping the calendar day', () => {
    expect(formatLongDatePtBR(parseISODate('2026-06-07'))).toBe('07 de junho de 2026')
  })

  it('keeps the calendar day at a year boundary', () => {
    expect(formatLongDatePtBR(parseISODate('2026-01-01'))).toBe('01 de janeiro de 2026')
  })

  it('formats a short pt-BR date keeping the calendar day', () => {
    expect(formatShortDatePtBR(parseISODate('2026-01-01'))).toBe('01/01')
  })

  it('formats the weekday keeping the calendar day', () => {
    expect(formatWeekdayPtBR(parseISODate('2026-06-07'))).toBe('Domingo')
  })
})
