import { describe, expect, it } from 'vitest'
import {
  bulletinSectionWindows,
  churchDayRange,
  churchYear,
  churchYearRange,
  currentTimeHHMM,
  currentWeekWindow,
  formatChurchDatePtBR,
  formatChurchDateTimeInput,
  formatChurchDateTimePtBR,
  isChurchDateTime,
  isISODate,
  formatISODate,
  formatLongDatePtBR,
  formatShortDatePtBR,
  formatWeekdayPtBR,
  nextWeekDateForWeekday,
  parseChurchDateTime,
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

describe('church time zone instants', () => {
  it('reads civil time as America/Sao_Paulo', () => {
    expect(parseChurchDateTime('2026-06-07T19:30').toISOString()).toBe('2026-06-07T22:30:00.000Z')
  })

  it('keeps a meeting that crosses midnight on separate civil days', () => {
    const started = parseChurchDateTime('2026-06-07T22:00')
    const ended = parseChurchDateTime('2026-06-08T00:30')

    expect(ended.getTime() - started.getTime()).toBe(150 * 60 * 1000)
  })

  it('round-trips an instant back to the civil time the operator typed', () => {
    expect(formatChurchDateTimeInput(parseChurchDateTime('2026-01-01T00:15'))).toBe('2026-01-01T00:15')
  })

  it('formats an instant as pt-BR civil time', () => {
    expect(formatChurchDateTimePtBR(parseChurchDateTime('2026-06-07T19:30'))).toBe('07/06/2026, 19:30')
  })

  it('formats an instant as a pt-BR civil date, without the time', () => {
    expect(formatChurchDatePtBR(parseChurchDateTime('2026-06-07T19:30'))).toBe('07/06/2026')
  })

  it('formats the civil day, not the UTC one', () => {
    expect(formatChurchDatePtBR(new Date('2026-06-08T02:00:00.000Z'))).toBe('07/06/2026')
  })

  it('derives the year from the civil time, not from UTC', () => {
    expect(churchYear(parseChurchDateTime('2026-12-31T23:00'))).toBe(2026)
    expect(churchYear(new Date('2027-01-01T02:00:00.000Z'))).toBe(2026)
  })

  it('spans a year from its first civil instant to the next year first', () => {
    expect(churchYearRange(2026)).toEqual({
      from: new Date('2026-01-01T03:00:00.000Z'),
      to: new Date('2027-01-01T03:00:00.000Z'),
    })
  })

  it('opens a year whose civil midnight the zone skipped on the first instant it reads as that year', () => {
    expect(churchYearRange(1914).from).toEqual(new Date('1914-01-01T03:06:28.000Z'))
    expect(churchYear(new Date('1914-01-01T03:06:27.000Z'))).toBe(1913)
    expect(churchYear(new Date('1914-01-01T03:06:28.000Z'))).toBe(1914)
  })

  // A record is filed under churchYear but found by churchYearRange, so a year the two
  // disagree about hides an Ata from the very listing that offers its year.
  it('agrees with churchYear on every boundary it can be asked about', () => {
    const disagreements: string[] = []

    for (let year = 1900; year <= 2100; year++) {
      const { from, to } = churchYearRange(year)

      for (const instant of [new Date(from.getTime() - 1), from, new Date(to.getTime() - 1), to]) {
        const withinRange = instant >= from && instant < to
        if ((churchYear(instant) === year) !== withinRange) {
          disagreements.push(`${year}: ${instant.toISOString()} reads as ${churchYear(instant)}`)
        }
      }
    }

    expect(disagreements).toEqual([])
  })
})

describe('isChurchDateTime', () => {
  it('accepts a civil time the zone really has', () => {
    expect(isChurchDateTime('2026-06-07T19:30')).toBe(true)
  })

  it('rejects anything that is not a civil date and time', () => {
    expect(isChurchDateTime('')).toBe(false)
    expect(isChurchDateTime('07/06/2026 19:30')).toBe(false)
    expect(isChurchDateTime('2026-06-07T19:30:00')).toBe(false)
  })

  it('rejects a day the calendar does not have', () => {
    expect(isChurchDateTime('2026-02-30T12:00')).toBe(false)
    expect(isChurchDateTime('2026-13-01T12:00')).toBe(false)
  })

  it('rejects an hour a daylight saving jump skipped', () => {
    expect(isChurchDateTime('2018-11-04T00:30')).toBe(false)
  })

  it('reads an hour a daylight saving end repeated as the earlier instant', () => {
    expect(isChurchDateTime('2018-02-17T23:30')).toBe(true)
    expect(parseChurchDateTime('2018-02-17T23:30').toISOString()).toBe('2018-02-18T01:30:00.000Z')
  })
})

describe('churchDayRange', () => {
  it('opens on the first instant of the first day', () => {
    const { from } = churchDayRange('2026-06-07', '2026-06-07')

    expect(todayISO(from)).toBe('2026-06-07')
    expect(todayISO(new Date(from.getTime() - 1000))).toBe('2026-06-06')
  })

  it('closes only after the last day has been spent whole', () => {
    const { to } = churchDayRange('2026-01-01', '2026-06-07')

    expect(todayISO(new Date(to.getTime() - 1000))).toBe('2026-06-07')
    expect(todayISO(to)).toBe('2026-06-08')
  })

  it('holds a single day even when a daylight saving jump skipped its midnight', () => {
    const { from, to } = churchDayRange('2018-11-04', '2018-11-04')

    expect(todayISO(from)).toBe('2018-11-04')
    expect(todayISO(new Date(from.getTime() - 1000))).toBe('2018-11-03')
    expect(todayISO(new Date(to.getTime() - 1000))).toBe('2018-11-04')
  })

  it('agrees with the day an instant reads as, every day of a year', () => {
    const disagreements: string[] = []

    for (let day = new Date('2026-01-01T03:00:00Z'); day < new Date('2027-01-01T03:00:00Z');) {
      const iso = todayISO(day)
      const { from, to } = churchDayRange(iso, iso)

      for (const instant of [new Date(from.getTime() - 1000), from, new Date(to.getTime() - 1000), to]) {
        const withinRange = instant >= from && instant < to
        if ((todayISO(instant) === iso) !== withinRange) disagreements.push(`${iso}: ${instant.toISOString()}`)
      }

      day = new Date(day.getTime() + 24 * 60 * 60 * 1000)
    }

    expect(disagreements).toEqual([])
  })
})

describe('isISODate', () => {
  it('accepts a calendar day', () => {
    expect(isISODate('2026-06-07')).toBe(true)
  })

  it('rejects anything that is not a calendar day', () => {
    expect(isISODate('')).toBe(false)
    expect(isISODate('07/06/2026')).toBe(false)
    expect(isISODate('2026-06-07T19:30')).toBe(false)
    expect(isISODate('2026-02-30')).toBe(false)
    expect(isISODate('2026-13-01')).toBe(false)
  })
})
