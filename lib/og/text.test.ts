import { describe, expect, it } from 'vitest'
import { fitTitleFontSize } from './text'

describe('fitTitleFontSize', () => {
  it('uses the largest size for short titles', () => {
    expect(fitTitleFontSize('Culto Solene')).toBe(74)
  })

  it('shrinks progressively as the title grows', () => {
    const short = fitTitleFontSize('a'.repeat(20))
    const medium = fitTitleFontSize('a'.repeat(50))
    const long = fitTitleFontSize('a'.repeat(90))
    const veryLong = fitTitleFontSize('a'.repeat(130))

    expect(short).toBeGreaterThan(medium)
    expect(medium).toBeGreaterThan(long)
    expect(long).toBeGreaterThan(veryLong)
  })

  it('never goes below the minimum for extreme lengths', () => {
    expect(fitTitleFontSize('a'.repeat(400))).toBe(32)
  })

  it('ignores surrounding whitespace when measuring', () => {
    expect(fitTitleFontSize('  Culto Solene  ')).toBe(fitTitleFontSize('Culto Solene'))
  })
})
