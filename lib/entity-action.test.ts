import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import type { Database } from '@/db'
import type { CurrentUser } from '@/lib/auth/current-user'
import { createTestDb } from '@/tests/db'
import { defineEntityAction, parseForm, requirePermission } from './entity-action'

function formData(entries: [string, string | Blob][]) {
  const data = new FormData()
  for (const [name, value] of entries) data.append(name, value)
  return data
}

function userWithPermission(canReturn: boolean): CurrentUser {
  return {
    id: 1,
    email: 'ana@example.com',
    name: 'Ana',
    can: vi.fn(() => canReturn),
  }
}

describe('parseForm', () => {
  it('converts unique string fields into a plain object', () => {
    expect(
      parseForm(
        formData([
          ['title', ' Café '],
          ['author', ''],
        ])
      )
    ).toEqual({ title: ' Café ', author: '' })
  })

  it('rejects files and repeated field names', () => {
    expect(() => parseForm(formData([['photo', new Blob(['x'])]]))).toThrow('FormData must contain only string fields')
    expect(() =>
      parseForm(
        formData([
          ['title', 'A'],
          ['title', 'B'],
        ])
      )
    ).toThrow('FormData must contain unique fields')
  })
})

describe('requirePermission', () => {
  it('returns an error state for absent users or missing permissions', () => {
    expect(requirePermission(null, 'articles', 'create')).toEqual({
      status: 'error',
      formError: 'Você não tem permissão para executar esta ação.',
    })

    expect(requirePermission(userWithPermission(false), 'articles', 'create')).toEqual({
      status: 'error',
      formError: 'Você não tem permissão para executar esta ação.',
    })
  })

  it('returns null when the user has the permission', () => {
    expect(requirePermission(userWithPermission(true), 'articles', 'create')).toBeNull()
  })
})

describe('defineEntityAction', () => {
  const schema = z.object({
    title: z.string().trim().min(1, 'Título é obrigatório'),
    author: z
      .string()
      .trim()
      .optional()
      .transform((value) => value || null),
  })

  it('denies before parsing or validating request input', async () => {
    const parse = vi.fn()
    const write = vi.fn()
    const { execute } = defineEntityAction({
      entity: 'articles',
      action: 'create',
      schema,
      parse,
      write,
    })

    const state = await execute({ user: null, db: {} as Database }, formData([['title', '']]))

    expect(state).toEqual({
      status: 'error',
      formError: 'Você não tem permissão para executar esta ação.',
    })
    expect(parse).not.toHaveBeenCalled()
    expect(write).not.toHaveBeenCalled()
  })

  it('denies users without permission before parsing or validating request input', async () => {
    const parse = vi.fn()
    const write = vi.fn()
    const user = userWithPermission(false)
    const { execute } = defineEntityAction({
      entity: 'articles',
      action: 'create',
      schema,
      parse,
      write,
    })

    const state = await execute({ user, db: {} as Database }, formData([['title', '']]))

    expect(state).toEqual({
      status: 'error',
      formError: 'Você não tem permissão para executar esta ação.',
    })
    expect(user.can).toHaveBeenCalledWith('articles', 'create')
    expect(parse).not.toHaveBeenCalled()
    expect(write).not.toHaveBeenCalled()
  })

  it('returns field errors when validation fails', async () => {
    const write = vi.fn()
    const { execute } = defineEntityAction({
      entity: 'articles',
      action: 'create',
      schema,
      write,
    })

    const state = await execute({ user: userWithPermission(true), db: {} as Database }, formData([['title', '']]))

    expect(state).toEqual({
      status: 'error',
      fieldErrors: { title: ['Título é obrigatório'] },
    })
    expect(write).not.toHaveBeenCalled()
  })

  it('uses a custom parser as an escape hatch before validation', async () => {
    const write = vi.fn()
    const parse = vi.fn(() => ({ title: 'Parsed title', author: '' }))
    const { execute } = defineEntityAction({
      entity: 'articles',
      action: 'create',
      schema,
      parse,
      write,
    })

    await execute({ user: userWithPermission(true), db: {} as Database }, formData([['payload', '{"title":"Parsed"}']]))

    expect(parse).toHaveBeenCalledWith(expect.any(FormData))
    expect(write).toHaveBeenCalledWith({
      user: expect.objectContaining({ email: 'ana@example.com' }),
      db: {},
      data: { title: 'Parsed title', author: null },
    })
  })

  it('writes validated data with injected pglite db, revalidates after write, and returns success', async () => {
    const calls: string[] = []
    const db = await createTestDb()
    const user = userWithPermission(true)
    const write = vi.fn(async ({ data }) => {
      calls.push('write')
      return { id: 7, title: data.title }
    })
    const revalidate = vi.fn(async () => {
      calls.push('revalidate')
    })
    const { execute } = defineEntityAction({
      entity: 'articles',
      action: 'create',
      schema,
      write,
      revalidate,
    })

    const state = await execute(
      { user, db },
      formData([
        ['title', '  Bom Artigo  '],
        ['author', ''],
      ])
    )

    expect(state).toEqual({ status: 'success' })
    expect(write).toHaveBeenCalledWith({ user, db, data: { title: 'Bom Artigo', author: null } })
    expect(revalidate).toHaveBeenCalledWith(
      { id: 7, title: 'Bom Artigo' },
      { user, db, data: { title: 'Bom Artigo', author: null } }
    )
    expect(calls).toEqual(['write', 'revalidate'])
  })

  it('returns a generic form error when write or revalidate fails', async () => {
    const writeFailure = defineEntityAction({
      entity: 'articles',
      action: 'create',
      schema,
      write: async () => {
        throw new Error('database failed')
      },
    })

    await expect(
      writeFailure.execute({ user: userWithPermission(true), db: {} as Database }, formData([['title', 'Ok']]))
    ).resolves.toEqual({ status: 'error', formError: 'Não foi possível concluir a ação.' })

    const revalidateFailure = defineEntityAction({
      entity: 'articles',
      action: 'create',
      schema,
      write: async () => ({ id: 1 }),
      revalidate: async () => {
        throw new Error('cache failed')
      },
    })

    await expect(
      revalidateFailure.execute({ user: userWithPermission(true), db: {} as Database }, formData([['title', 'Ok']]))
    ).resolves.toEqual({ status: 'error', formError: 'Não foi possível concluir a ação.' })
  })
})
