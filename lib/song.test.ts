import { describe, expect, it } from 'vitest'
import { songReference } from './song'

describe('songReference', () => {
  it('returns "<track>. <album>" when both track and album are present', () => {
    expect(songReference({ track: 27, album: 'Novo Cântico', performer: 'Coral', songwriter: 'Autor' })).toBe(
      '27. Novo Cântico'
    )
  })

  it('falls back to performer when track or album is missing', () => {
    expect(songReference({ track: null, album: 'Novo Cântico', performer: 'Coral', songwriter: 'Autor' })).toBe('Coral')
    expect(songReference({ track: 27, album: null, performer: 'Coral', songwriter: 'Autor' })).toBe('Coral')
  })

  it('falls back to songwriter when performer is also missing', () => {
    expect(songReference({ track: null, album: null, performer: null, songwriter: 'Autor' })).toBe('Autor')
  })

  it('returns null when no field is available', () => {
    expect(songReference({ track: null, album: null, performer: null, songwriter: null })).toBeNull()
  })
})
