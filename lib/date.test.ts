import { describe, expect, it } from 'vitest'
import { formatLongDatePtBR } from './date'

describe('formatLongDatePtBR', () => {
  it('formats a date-only string as a long pt-BR date', () => {
    expect(formatLongDatePtBR('2026-06-07')).toBe('07 de junho de 2026')
  })

  it('keeps the calendar day regardless of timezone (no off-by-one)', () => {
    // A naive new Date('2026-01-01') parses as UTC midnight and can roll back
    // to Dec 31 in negative-offset zones. The day must stay put.
    expect(formatLongDatePtBR('2026-01-01')).toBe('01 de janeiro de 2026')
  })
})
