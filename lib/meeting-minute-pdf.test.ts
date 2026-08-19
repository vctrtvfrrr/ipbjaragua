import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMeetingMinute } from '@/db/queries/meeting-minutes'
import type { CurrentUser } from '@/lib/auth/current-user'
import { generateMeetingMinutePdf } from '@/lib/meeting-minute-pdf'
import { closeSharedBrowser } from '@/lib/pdf/browser'
import { createTestDb, type TestDb } from '@/tests/db'

function user(permissions: 'read' | 'none'): CurrentUser {
  return {
    id: 1,
    email: 'ana@example.com',
    name: 'Ana',
    can: vi.fn((_entity, action) => permissions === 'read' && action === 'read'),
  }
}

function minute(overrides: Record<string, unknown> = {}) {
  return {
    number: 12,
    title: 'IPB de Jaraguá do Sul',
    started_at: new Date('2026-06-07T22:30:00Z'),
    ended_at: new Date('2026-06-08T00:00:00Z'),
    location: 'Salão social',
    attendees: '- Pastor João',
    opening: 'A reunião foi aberta com oração.',
    closing: 'Nada mais havendo a tratar.',
    topics: [{ title: 'Orçamento', discussion: 'O orçamento anual foi aprovado.' }],
    ...overrides,
  }
}

let db: TestDb

beforeEach(async () => {
  db = await createTestDb()
})

afterAll(async () => {
  await closeSharedBrowser()
})

describe('generateMeetingMinutePdf', () => {
  it('refuses a request without an active session', async () => {
    expect(await generateMeetingMinutePdf(null, 1, db)).toEqual({ status: 'forbidden' })
  })

  it('refuses a Usuário without read on Atas', async () => {
    const reader = user('none')

    expect(await generateMeetingMinutePdf(reader, 1, db)).toEqual({ status: 'forbidden' })
    expect(reader.can).toHaveBeenCalledWith('meeting_minutes', 'read')
  })

  it('reports an Ata that does not exist', async () => {
    expect(await generateMeetingMinutePdf(user('read'), 404, db)).toEqual({ status: 'not-found' })
    expect(await generateMeetingMinutePdf(user('read'), Number('abc'), db)).toEqual({ status: 'not-found' })
  })

  it('returns the document named after the Número', { timeout: 60_000 }, async () => {
    const created = await createMeetingMinute(minute(), db)

    const result = await generateMeetingMinutePdf(user('read'), created.id, db)

    expect(result).toMatchObject({ status: 'ok', filename: 'ata-12.pdf' })
    expect(result.status === 'ok' && result.pdf.subarray(0, 5).toString()).toBe('%PDF-')
  })

  it('fails visibly instead of dropping an image it may not fetch', { timeout: 60_000 }, async () => {
    const created = await createMeetingMinute(
      minute({ opening: 'Aberta com ![diagrama](https://localhost/diagrama.png) em anexo.' }),
      db
    )

    expect(await generateMeetingMinutePdf(user('read'), created.id, db)).toEqual({
      status: 'failed',
      message: expect.stringContaining('o destino não é um endereço público'),
    })
  })
})
