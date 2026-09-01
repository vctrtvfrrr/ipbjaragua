import { describe, expect, it, vi } from 'vitest'
import type { CurrentUser } from '@/lib/auth/current-user'
import { requireMeetingMinuteBookAccess } from './require-book-access'

vi.mock('next/navigation', () => ({
  forbidden: vi.fn(() => {
    throw new Error('FORBIDDEN')
  }),
  notFound: vi.fn(() => {
    throw new Error('NOT_FOUND')
  }),
}))

function fakeUser(canRead: boolean): CurrentUser {
  return {
    id: 1,
    email: 'ana@example.com',
    name: 'Ana',
    can: vi.fn(() => canRead),
  }
}

describe('requireMeetingMinuteBookAccess', () => {
  it('calls notFound() for a slug outside the closed list', () => {
    expect(() => requireMeetingMinuteBookAccess(fakeUser(true), 'conselho')).toThrow('NOT_FOUND')
  })

  it('calls forbidden() when the Usuário lacks read on that Livro', () => {
    const user = fakeUser(false)

    expect(() => requireMeetingMinuteBookAccess(user, 'mesa-administrativa')).toThrow('FORBIDDEN')
    expect(user.can).toHaveBeenCalledWith('meeting_minutes', 'read', 'mesa-administrativa')
  })

  it('calls forbidden() for an unauthenticated request', () => {
    expect(() => requireMeetingMinuteBookAccess(null, 'mesa-administrativa')).toThrow('FORBIDDEN')
  })

  it('returns the Livro definition when the Usuário can read it', () => {
    expect(requireMeetingMinuteBookAccess(fakeUser(true), 'secretaria-de-musica')).toMatchObject({
      slug: 'secretaria-de-musica',
      label: 'Secretaria de Música',
    })
  })
})
