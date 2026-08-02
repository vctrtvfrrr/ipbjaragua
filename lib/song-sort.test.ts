import { describe, expect, it } from 'vitest'
import { resolveSongSort, songListPath } from './song-sort'

describe('resolveSongSort', () => {
  it('reads a recognised field and direction', () => {
    expect(resolveSongSort({ sort: 'reference', dir: 'desc' })).toEqual({ field: 'reference', direction: 'desc' })
  })

  it('falls back to the default when the field is missing or unknown', () => {
    expect(resolveSongSort({})).toEqual({ field: 'title', direction: 'asc' })
    expect(resolveSongSort({ sort: 'performer' })).toEqual({ field: 'title', direction: 'asc' })
    expect(resolveSongSort({ sort: ['title', 'reference'] })).toEqual({ field: 'title', direction: 'asc' })
  })

  it('keeps a recognised field when only the direction is unusable', () => {
    expect(resolveSongSort({ sort: 'reference', dir: 'sideways' })).toEqual({
      field: 'reference',
      direction: 'asc',
    })
  })
})

describe('songListPath', () => {
  it('round-trips through resolveSongSort', () => {
    const sort = { field: 'reference', direction: 'desc' } as const
    const [, query] = songListPath(sort).split('?')
    const params = Object.fromEntries(new URLSearchParams(query))

    expect(resolveSongSort(params)).toEqual(sort)
  })

  it('ignores anything the caller did not have resolved', () => {
    expect(songListPath(resolveSongSort({ sort: 'javascript:alert(1)' }))).toBe('/admin/songs?sort=title&dir=asc')
  })
})
