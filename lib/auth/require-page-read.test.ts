import { describe, expect, it, vi } from 'vitest'
import type { CurrentUser } from './current-user'
import { requirePageReadFor } from './require-page-read'

vi.mock('next/navigation', () => ({
  forbidden: vi.fn(() => {
    throw new Error('FORBIDDEN')
  }),
}))

function fakeUser(canRead: boolean): CurrentUser {
  return {
    id: 1,
    email: 'ana@example.com',
    name: 'Ana',
    can: vi.fn((_entity, action) => canRead && action === 'read'),
  }
}

describe('requirePageReadFor', () => {
  it('calls forbidden() when there is no user', () => {
    expect(() => requirePageReadFor(null, 'articles')).toThrow('FORBIDDEN')
  })

  it('calls forbidden() when the user lacks read on the entity', () => {
    const user = fakeUser(false)

    expect(() => requirePageReadFor(user, 'articles')).toThrow('FORBIDDEN')
    expect(user.can).toHaveBeenCalledWith('articles', 'read')
  })

  it('returns the user when it can read the entity', () => {
    const user = fakeUser(true)

    expect(requirePageReadFor(user, 'articles')).toBe(user)
  })
})
