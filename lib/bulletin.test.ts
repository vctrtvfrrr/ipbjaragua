import { describe, expect, it } from 'vitest'
import { parseISODate } from './date'
import {
  bulletinYear,
  formatBulletinSubtitle,
  formatCoupleLabel,
  liturgySlug,
  toRoman,
  truncateGivenName,
} from './bulletin'

const d = (iso: string) => parseISODate(iso)

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
    expect(bulletinYear(d('2025-02-09'))).toBe(1)
    expect(bulletinYear(d('2026-02-08'))).toBe(1)
  })

  it('returns II from the first anniversary onward', () => {
    expect(bulletinYear(d('2026-02-09'))).toBe(2)
    expect(bulletinYear(d('2026-05-24'))).toBe(2)
    expect(bulletinYear(d('2026-06-07'))).toBe(2)
  })
})

describe('liturgySlug', () => {
  it('combines date and slugified theme', () => {
    expect(liturgySlug(d('2026-06-07'), 'Culto Solene')).toBe('2026-06-07-culto-solene')
  })

  it('handles accents and special chars in theme', () => {
    expect(liturgySlug(d('2026-06-07'), 'Culto de Ações de Graças')).toBe('2026-06-07-culto-de-acoes-de-gracas')
  })

  it('inserts HHMM between date and theme slug when time is provided', () => {
    expect(liturgySlug(d('2026-06-07'), 'Culto Solene', '09:00')).toBe('2026-06-07-0900-culto-solene')
  })

  it('truncates seconds from a HH:MM:SS time so the URL stays stable', () => {
    expect(liturgySlug(d('2026-06-07'), 'Culto Solene', '18:00:00')).toBe('2026-06-07-1800-culto-solene')
  })

  it('ignores null or undefined time', () => {
    expect(liturgySlug(d('2026-06-07'), 'Culto Solene', null)).toBe('2026-06-07-culto-solene')
    expect(liturgySlug(d('2026-06-07'), 'Culto Solene', undefined)).toBe('2026-06-07-culto-solene')
  })
})

describe('truncateGivenName', () => {
  it('returns both tokens when neither is a preposition', () => {
    expect(truncateGivenName('Júlio Cesar')).toBe('Júlio Cesar')
  })

  it('stops before a preposition as token1', () => {
    expect(truncateGivenName('João de Souza')).toBe('João')
    expect(truncateGivenName('Ana da Silva')).toBe('Ana')
    expect(truncateGivenName('Ana Lúcia de Souza')).toBe('Ana Lúcia')
  })

  it('returns a single token when name has only one word', () => {
    expect(truncateGivenName('Maria')).toBe('Maria')
  })
})

describe('formatCoupleLabel', () => {
  it('puts the female member first, separated by ♥', () => {
    const female = { full_name: 'Ana Lúcia de Souza', sex: 'Feminino' }
    const male = { full_name: 'Júlio Cesar Oliveira', sex: 'Masculino' }
    expect(formatCoupleLabel(female, male)).toBe('Ana Lúcia ♥ Júlio Cesar')
    expect(formatCoupleLabel(male, female)).toBe('Ana Lúcia ♥ Júlio Cesar')
  })

  it('falls back to alphabetical order when sex is ambiguous', () => {
    const a = { full_name: 'Marcos da Silva', sex: 'Masculino' }
    const b = { full_name: 'Bruno de Alves', sex: 'Masculino' }
    expect(formatCoupleLabel(a, b)).toBe('Bruno ♥ Marcos')
  })
})

describe('formatBulletinSubtitle', () => {
  it('formats edition with feminine ordinal and roman year', () => {
    expect(formatBulletinSubtitle(70, d('2026-06-07'))).toBe('70ª Edição — Ano II')
    expect(formatBulletinSubtitle(1, d('2025-02-09'))).toBe('1ª Edição — Ano I')
    expect(formatBulletinSubtitle(68, d('2026-05-24'))).toBe('68ª Edição — Ano II')
  })
})
