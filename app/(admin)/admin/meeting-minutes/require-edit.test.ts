import { describe, expect, it, vi } from 'vitest'
import type { MeetingMinuteWithTopics } from '@/db/queries/meeting-minutes'
import { meetingMinuteBookBySlug } from '@/lib/meeting-minute-books'
import { requireMeetingMinuteEdit } from './require-edit'

vi.mock('next/navigation', () => ({
  forbidden: vi.fn(() => {
    throw new Error('FORBIDDEN')
  }),
  notFound: vi.fn(() => {
    throw new Error('NOT_FOUND')
  }),
}))

const MESA = meetingMinuteBookBySlug('mesa-administrativa')!
const MUSICA = meetingMinuteBookBySlug('secretaria-de-musica')!

function fakeMinute(status: 'pending' | 'approved', book: string = MESA.slug): MeetingMinuteWithTopics {
  return { id: 1, status, book, topics: [] } as unknown as MeetingMinuteWithTopics
}

describe('requireMeetingMinuteEdit', () => {
  it('calls notFound() when the Ata does not exist', () => {
    expect(() => requireMeetingMinuteEdit(MESA, null)).toThrow('NOT_FOUND')
  })

  it('calls notFound() when the Ata belongs to another Livro', () => {
    expect(() => requireMeetingMinuteEdit(MUSICA, fakeMinute('pending', MESA.slug))).toThrow('NOT_FOUND')
  })

  it('calls forbidden() when the Ata is Aprovada', () => {
    expect(() => requireMeetingMinuteEdit(MESA, fakeMinute('approved'))).toThrow('FORBIDDEN')
  })

  it('returns the Ata when it belongs to the Livro and is Pendente', () => {
    const minute = fakeMinute('pending')

    expect(requireMeetingMinuteEdit(MESA, minute)).toBe(minute)
  })
})
