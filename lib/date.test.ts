import { describe, expect, it } from 'vitest'
import {
  bulletinSectionWindows,
  currentTimeHHMM,
  currentWeekWindow,
  formatISODate,
  formatLongDatePtBR,
  formatShortDatePtBR,
  formatWeekdayPtBR,
  nextWeekDateForWeekday,
  parseISODate,
  today,
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

describe('reading a given instant', () => {
  it('derives date and time from the same instant, on either side of midnight', () => {
    // 02:59 UTC is 23:59 of the previous day in São Paulo; one minute later both must move together.
    const beforeMidnight = new Date('2026-08-03T02:59:00Z')
    const afterMidnight = new Date('2026-08-03T03:00:00Z')

    expect([formatISODate(today(beforeMidnight)), currentTimeHHMM(beforeMidnight)]).toEqual(['2026-08-02', '23:59'])
    expect([formatISODate(today(afterMidnight)), currentTimeHHMM(afterMidnight)]).toEqual(['2026-08-03', '00:00'])
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

describe('nextWeekDateForWeekday', () => {
  it('suggests Thursday in the week after 2026-07-07', () => {
    const result = nextWeekDateForWeekday(parseISODate('2026-07-07'), 4)

    expect(formatISODate(result)).toBe('2026-07-16')
  })

  it('handles Sunday as the last day of the next week window', () => {
    const result = nextWeekDateForWeekday(parseISODate('2026-07-07'), 0)

    expect(formatISODate(result)).toBe('2026-07-19')
  })

  it('crosses month boundaries', () => {
    const result = nextWeekDateForWeekday(parseISODate('2026-07-30'), 1)

    expect(formatISODate(result)).toBe('2026-08-03')
  })
})

describe('bulletinSectionWindows', () => {
  const windows = (iso: string) => {
    const result = bulletinSectionWindows(parseISODate(iso))
    return {
      agenda: { from: formatISODate(result.agenda.from), to: formatISODate(result.agenda.to) },
      birthdays: { from: formatISODate(result.birthdays.from), to: formatISODate(result.birthdays.to) },
    }
  }

  it('derives birthdays as Sunday→Saturday and agenda as Monday→next Sunday for a Sunday bulletin', () => {
    expect(windows('2026-06-07')).toEqual({
      agenda: { from: '2026-06-08', to: '2026-06-14' },
      birthdays: { from: '2026-06-07', to: '2026-06-13' },
    })
  })

  it('uses the containing week for an exceptional weekday bulletin', () => {
    expect(windows('2026-06-10')).toEqual({
      agenda: { from: '2026-06-08', to: '2026-06-14' },
      birthdays: { from: '2026-06-07', to: '2026-06-13' },
    })
  })

  it('handles windows that cross year boundaries', () => {
    expect(windows('2026-12-31')).toEqual({
      agenda: { from: '2026-12-28', to: '2027-01-03' },
      birthdays: { from: '2026-12-27', to: '2027-01-02' },
    })
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
