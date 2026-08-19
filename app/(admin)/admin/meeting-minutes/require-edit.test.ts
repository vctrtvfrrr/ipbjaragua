import { describe, expect, it, vi } from 'vitest'
import type { MeetingMinuteWithTopics } from '@/db/queries/meeting-minutes'
import type { CurrentUser } from '@/lib/auth/current-user'
import { requireMeetingMinuteEdit } from './require-edit'

vi.mock('next/navigation', () => ({
  forbidden: vi.fn(() => {
    throw new Error('FORBIDDEN')
  }),
  notFound: vi.fn(() => {
    throw new Error('NOT_FOUND')
  }),
}))

function fakeUser(canUpdate: boolean): CurrentUser {
  return {
    id: 1,
    email: 'ana@example.com',
    name: 'Ana',
    can: vi.fn((_entity, action) => canUpdate && action === 'update'),
  }
}

function fakeMinute(status: 'pending' | 'approved'): MeetingMinuteWithTopics {
  return { id: 1, status, topics: [] } as unknown as MeetingMinuteWithTopics
}

describe('requireMeetingMinuteEdit', () => {
  it('calls forbidden() when the user lacks update on meeting_minutes', () => {
    const user = fakeUser(false)

    expect(() => requireMeetingMinuteEdit(user, fakeMinute('pending'))).toThrow('FORBIDDEN')
    expect(user.can).toHaveBeenCalledWith('meeting_minutes', 'update')
  })

  it('calls notFound() when the Ata does not exist', () => {
    expect(() => requireMeetingMinuteEdit(fakeUser(true), null)).toThrow('NOT_FOUND')
  })

  it('calls forbidden() when the Ata is Aprovada', () => {
    expect(() => requireMeetingMinuteEdit(fakeUser(true), fakeMinute('approved'))).toThrow('FORBIDDEN')
  })

  it('returns the Ata when the user can update and it is Pendente', () => {
    const minute = fakeMinute('pending')

    expect(requireMeetingMinuteEdit(fakeUser(true), minute)).toBe(minute)
  })
})
