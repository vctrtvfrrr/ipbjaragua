import { describe, expect, it } from 'vitest'
import { currentWeekWindow, formatLongDatePtBR, todayISO } from './date'

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

describe('currentWeekWindow', () => {
  it('returns Mon→Sun window for a Friday', () => {
    expect(currentWeekWindow('2026-06-12')).toEqual({ from: '2026-06-08', to: '2026-06-14' })
  })

  it('returns Mon→Sun window when today is Monday', () => {
    expect(currentWeekWindow('2026-06-08')).toEqual({ from: '2026-06-08', to: '2026-06-14' })
  })

  it('returns Mon→Sun window when today is Sunday (last day, not start of new week)', () => {
    expect(currentWeekWindow('2026-06-14')).toEqual({ from: '2026-06-08', to: '2026-06-14' })
  })

  it('handles a week that spans month boundary', () => {
    expect(currentWeekWindow('2026-06-30')).toEqual({ from: '2026-06-29', to: '2026-07-05' })
  })
})

describe('formatLongDatePtBR', () => {
  it('formats a date-only string as a long pt-BR date', () => {
    expect(formatLongDatePtBR('2026-06-07')).toBe('07 de junho de 2026')
  })

  it('keeps the calendar day regardless of timezone (no off-by-one)', () => {
    expect(formatLongDatePtBR('2026-01-01')).toBe('01 de janeiro de 2026')
  })
})
