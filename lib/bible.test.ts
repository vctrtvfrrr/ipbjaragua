import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type * as Bible from './bible'

let bible: typeof Bible
let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>

function downloadsOf(book: string): number {
  return fetchMock.mock.calls.filter(([url]) => String(url).endsWith(`/ARA/${book}.json`)).length
}

function bookResponse(): Response {
  return Response.json({ chapters: [] })
}

async function fetchBooks(books: string[]) {
  for (const book of books) await bible.fetchBibleBook('ARA', book)
}

function booksNamed(count: number, prefix = 'B'): string[] {
  return Array.from({ length: count }, (_, index) => `${prefix}${index}`)
}

describe('fetchBibleBook', () => {
  beforeEach(async () => {
    fetchMock = vi.fn<typeof fetch>(async () => bookResponse())
    vi.stubGlobal('fetch', fetchMock)
    vi.resetModules()
    bible = await import('./bible')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('downloads a book once and serves it from the cache afterwards', async () => {
    await fetchBooks(['PSA', 'PSA'])

    expect(downloadsOf('PSA')).toBe(1)
  })

  it('shares one download between concurrent requests for the same book', async () => {
    await Promise.all([bible.fetchBibleBook('ARA', 'PSA'), bible.fetchBibleBook('ARA', 'PSA')])

    expect(downloadsOf('PSA')).toBe(1)
  })

  it('never holds more than the limit and evicts the least recently used book', async () => {
    const books = booksNamed(bible.BIBLE_BOOK_CACHE_SIZE + 1)
    await fetchBooks(books)

    await fetchBooks(books.slice(1))
    expect(fetchMock).toHaveBeenCalledTimes(books.length)

    await fetchBooks([books[0]])
    expect(downloadsOf(books[0])).toBe(2)
  })

  it('moves a book read again to the top, so older books are evicted before it', async () => {
    const books = booksNamed(bible.BIBLE_BOOK_CACHE_SIZE)
    await fetchBooks(books)

    await fetchBooks([books[0], 'NEW'])

    await fetchBooks([books[0]])
    expect(downloadsOf(books[0])).toBe(1)
    await fetchBooks([books[1]])
    expect(downloadsOf(books[1])).toBe(2)
  })

  it('does not cache a failed download', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }))

    await expect(bible.fetchBibleBook('ARA', 'PSA')).rejects.toThrow('503')
    await fetchBooks(['PSA'])

    expect(downloadsOf('PSA')).toBe(2)
  })

  it('keeps a newer download when an evicted one for the same book fails later', async () => {
    let failStale!: () => void
    fetchMock.mockImplementationOnce(
      () => new Promise<Response>((resolve) => (failStale = () => resolve(new Response(null, { status: 503 }))))
    )
    const stale = bible.fetchBibleBook('ARA', 'PSA')
    await fetchBooks(booksNamed(bible.BIBLE_BOOK_CACHE_SIZE))
    await fetchBooks(['PSA'])

    failStale()
    await expect(stale).rejects.toThrow('503')
    await fetchBooks(['PSA'])

    expect(downloadsOf('PSA')).toBe(2)
  })
})
