import { describe, expect, it } from 'vitest'
import { bulletinYear, formatBulletinSubtitle, liturgySlug, toRoman } from './bulletin'

describe('toRoman', () => {
  it('converts small integers to roman numerals', () => {
    expect(toRoman(1)).toBe('I')
    expect(toRoman(2)).toBe('II')
    expect(toRoman(4)).toBe('IV')
    expect(toRoman(9)).toBe('IX')
    expect(toRoman(10)).toBe('X')
  })
})

describe('bulletinYear', () => {
  it('returns I for dates before the first anniversary', () => {
    // anchor: 2025-02-09
    expect(bulletinYear('2025-02-09')).toBe(1) // launch date → Ano I
    expect(bulletinYear('2026-02-08')).toBe(1) // one day before first anniversary
  })

  it('returns II from the first anniversary onward', () => {
    expect(bulletinYear('2026-02-09')).toBe(2) // exactly 1 year after anchor
    expect(bulletinYear('2026-05-24')).toBe(2)
    expect(bulletinYear('2026-06-07')).toBe(2)
  })
})

describe('liturgySlug', () => {
  it('combines date and slugified theme', () => {
    expect(liturgySlug('2026-06-07', 'Culto Solene')).toBe('2026-06-07-culto-solene')
  })

  it('handles accents and special chars in theme', () => {
    expect(liturgySlug('2026-06-07', 'Culto de Ações de Graças')).toBe('2026-06-07-culto-de-acoes-de-gracas')
  })

  it('inserts HHMM between date and theme slug when time is provided', () => {
    expect(liturgySlug('2026-06-07', 'Culto Solene', '09:00')).toBe('2026-06-07-0900-culto-solene')
  })

  it('ignores null or undefined time', () => {
    expect(liturgySlug('2026-06-07', 'Culto Solene', null)).toBe('2026-06-07-culto-solene')
    expect(liturgySlug('2026-06-07', 'Culto Solene', undefined)).toBe('2026-06-07-culto-solene')
  })
})

describe('formatBulletinSubtitle', () => {
  it('formats edition with feminine ordinal and roman year', () => {
    expect(formatBulletinSubtitle(70, '2026-06-07')).toBe('70ª Edição — Ano II')
    expect(formatBulletinSubtitle(1, '2025-02-09')).toBe('1ª Edição — Ano I')
    expect(formatBulletinSubtitle(68, '2026-05-24')).toBe('68ª Edição — Ano II')
  })
})
