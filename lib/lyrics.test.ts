import { describe, expect, it } from 'vitest'
import { lyricsBlocksSchema, moveArrayItem, renumberLyrics, serializedLyricsSchema } from './lyrics'
import type { LyricsBlock } from './song'

describe('lyricsBlocksSchema', () => {
  it('accepts numbered verses and choruses with null number', () => {
    const result = lyricsBlocksSchema.safeParse([
      { type: 'verse', number: 1, content: 'Primeira estrofe' },
      { type: 'chorus', number: null, content: 'Coro' },
      { type: 'verse', number: 2, content: 'Segunda estrofe' },
    ])

    expect(result.success).toBe(true)
  })

  it('requires at least one block and non-empty content', () => {
    expect(lyricsBlocksSchema.safeParse([]).success).toBe(false)
    expect(lyricsBlocksSchema.safeParse([{ type: 'verse', number: 1, content: '   ' }]).success).toBe(false)
  })

  it('rejects skipped or duplicated verse numbers', () => {
    const result = lyricsBlocksSchema.safeParse([
      { type: 'verse', number: 1, content: 'Primeira' },
      { type: 'chorus', number: null, content: 'Coro' },
      { type: 'verse', number: 3, content: 'Terceira' },
    ])

    expect(result.success).toBe(false)
  })

  it('decodes serialized lyrics from a hidden input payload', () => {
    const result = serializedLyricsSchema.parse(
      JSON.stringify([{ type: 'verse', number: 1, content: 'Linha 1\nLinha 2' }])
    )

    expect(result).toEqual([{ type: 'verse', number: 1, content: 'Linha 1\nLinha 2' }])
  })
})

describe('renumberLyrics', () => {
  it('numbers verses by order and ignores choruses', () => {
    const blocks: LyricsBlock[] = [
      { type: 'verse', number: 7, content: 'A' },
      { type: 'chorus', number: 2, content: 'B' },
      { type: 'verse', number: 7, content: 'C' },
    ]

    expect(renumberLyrics(blocks)).toEqual([
      { type: 'verse', number: 1, content: 'A' },
      { type: 'chorus', number: null, content: 'B' },
      { type: 'verse', number: 2, content: 'C' },
    ])
  })
})

describe('moveArrayItem', () => {
  it('moves an item without mutating the original array', () => {
    const items = ['a', 'b', 'c']

    expect(moveArrayItem(items, 2, 0)).toEqual(['c', 'a', 'b'])
    expect(items).toEqual(['a', 'b', 'c'])
  })

  it('returns a copy when indexes are outside the array', () => {
    const items = ['a', 'b']
    const moved = moveArrayItem(items, -1, 1)

    expect(moved).toEqual(items)
    expect(moved).not.toBe(items)
  })
})
