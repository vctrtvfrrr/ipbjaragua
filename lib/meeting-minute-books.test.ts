import { describe, expect, it } from 'vitest'
import {
  isMeetingMinuteBookSlug,
  meetingMinuteBookBySlug,
  MEETING_MINUTE_BOOK_SLUGS,
  MEETING_MINUTE_BOOKS,
} from './meeting-minute-books'

describe('MEETING_MINUTE_BOOKS', () => {
  it('carries exactly the slugs of the closed list, in the same order', () => {
    expect(MEETING_MINUTE_BOOKS.map((book) => book.slug)).toEqual([...MEETING_MINUTE_BOOK_SLUGS])
  })

  it('ends every genitive with its own label', () => {
    for (const book of MEETING_MINUTE_BOOKS) {
      expect(book.genitive.endsWith(book.label)).toBe(true)
    }
  })
})

describe('meetingMinuteBookBySlug', () => {
  it('finds a Livro of the closed list', () => {
    expect(meetingMinuteBookBySlug('mesa-administrativa')).toMatchObject({ label: 'Mesa Administrativa' })
  })

  it('returns undefined for a slug outside the closed list', () => {
    expect(meetingMinuteBookBySlug('conselho')).toBeUndefined()
  })
})

describe('isMeetingMinuteBookSlug', () => {
  it('accepts every slug of the closed list', () => {
    for (const slug of MEETING_MINUTE_BOOK_SLUGS) {
      expect(isMeetingMinuteBookSlug(slug)).toBe(true)
    }
  })

  it('rejects a slug outside the closed list', () => {
    expect(isMeetingMinuteBookSlug('conselho')).toBe(false)
  })
})
