import { describe, expect, it } from 'vitest'
import { slugify } from './slug'

describe('slugify', () => {
  it('normalizes text into a lowercase ASCII slug', () => {
    expect(slugify(' Café com Leite! ')).toBe('cafe-com-leite')
    expect(slugify('São João D’Ávila')).toBe('sao-joao-d-avila')
    expect(slugify('  Várias   Palavras___Juntas  ')).toBe('varias-palavras-juntas')
  })

  it('returns an empty slug when no alphanumeric content remains', () => {
    expect(slugify('---')).toBe('')
    expect(slugify('')).toBe('')
  })
})
