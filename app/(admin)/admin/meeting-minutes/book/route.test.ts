import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MEETING_MINUTE_BOOK_EMPTY,
  MEETING_MINUTE_BOOK_FAILURE,
  MEETING_MINUTE_BOOK_INVALID,
} from '@/lib/meeting-minute-book'
import { generateMeetingMinuteBook, type MeetingMinuteBookResult } from '@/lib/meeting-minute-book-pdf'
import { GET } from './route'

vi.mock('@/lib/auth/current-user', () => ({ readCurrentUser: vi.fn() }))
vi.mock('@/lib/meeting-minute-book-pdf', () => ({ generateMeetingMinuteBook: vi.fn() }))

const generate = vi.mocked(generateMeetingMinuteBook)

const TOKEN = '0e1d2c3b-4a59-4867-8f90-a1b2c3d4e5f6'

function request(): Request {
  const query = new URLSearchParams({ from: '2026-01-01', to: '2026-12-31', order: 'chronological', token: TOKEN })

  return new Request(`https://ipbjaragua.org.br/admin/meeting-minutes/book?${query}`)
}

function answering(result: MeetingMinuteBookResult): void {
  generate.mockResolvedValue(result)
}

beforeEach(() => {
  generate.mockReset()
})

describe('the Livro de Atas route', () => {
  it('passes the requested period, order and operation on', async () => {
    answering({ status: 'empty' })

    await GET(request())

    expect(generate).toHaveBeenCalledWith(expect.any(Function), {
      from: '2026-01-01',
      to: '2026-12-31',
      order: 'chronological',
      token: TOKEN,
    })
  })

  it('refuses a request the Permissão does not cover', async () => {
    answering({ status: 'forbidden' })

    const response = await GET(request())

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ message: 'Acesso negado.' })
  })

  it('reports a period it cannot read as a period', async () => {
    answering({ status: 'invalid' })

    const response = await GET(request())

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ message: MEETING_MINUTE_BOOK_INVALID })
  })

  it('refuses to answer with an empty Livro', async () => {
    answering({ status: 'empty' })

    const response = await GET(request())

    expect(response.status).toBe(422)
    expect(await response.json()).toEqual({ message: MEETING_MINUTE_BOOK_EMPTY })
  })

  it('passes a failure on with the way out of it', async () => {
    answering({ status: 'failed', message: MEETING_MINUTE_BOOK_FAILURE })

    const response = await GET(request())

    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ message: MEETING_MINUTE_BOOK_FAILURE })
  })

  it('hands the Livro over as a download that no cache may keep', async () => {
    answering({ status: 'ok', pdf: Buffer.from('%PDF-1.7 livro'), filename: 'livro-de-atas-7-9.pdf' })

    const response = await GET(request())

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/pdf')
    expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="livro-de-atas-7-9.pdf"')
    expect(response.headers.get('Cache-Control')).toBe('no-store, private')
    expect(Buffer.from(await response.arrayBuffer()).toString()).toBe('%PDF-1.7 livro')
  })
})
