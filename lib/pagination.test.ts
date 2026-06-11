import { describe, expect, it } from 'vitest'
import { resolvePage, totalPages } from './pagination'

describe('totalPages', () => {
  it('is at least 1 even with no items', () => {
    expect(totalPages(0, 50)).toBe(1)
  })

  it('does not add a page for an exact fit', () => {
    expect(totalPages(50, 50)).toBe(1)
  })

  it('rounds up a partial last page', () => {
    expect(totalPages(51, 50)).toBe(2)
    expect(totalPages(100, 12)).toBe(9)
  })
})

describe('resolvePage', () => {
  it('returns the requested page when valid', () => {
    expect(resolvePage('2', 5)).toBe(2)
  })

  it('defaults to 1 when missing', () => {
    expect(resolvePage(undefined, 5)).toBe(1)
  })

  it('clamps non-positive and non-numeric values to 1', () => {
    expect(resolvePage('0', 5)).toBe(1)
    expect(resolvePage('-3', 5)).toBe(1)
    expect(resolvePage('abc', 5)).toBe(1)
    expect(resolvePage('1.5', 5)).toBe(1)
  })

  it('clamps a page above the total down to the last page', () => {
    expect(resolvePage('999', 5)).toBe(5)
  })

  it('treats a repeated param as invalid', () => {
    expect(resolvePage(['2', '3'], 5)).toBe(1)
  })
})
