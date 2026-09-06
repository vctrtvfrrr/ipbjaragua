import type { BibleBook } from '@/lib/bible-reference'

// A fork under the project's control, so the source cannot be archived or made private out
// from under the Painel. Its `main` only moves when the project syncs it, which is what makes
// a branch ref a pin here — see ADR-0023.
const SOURCE = 'https://cdn.jsdelivr.net/gh/vctrtvfrrr/biblias@main/data/canonical'

export const BIBLE_VERSIONS = ['ARA', 'NAA', 'ACF', 'ARC', 'NVI', 'NTLH', 'NVT'] as const

export type BibleVersion = (typeof BIBLE_VERSIONS)[number]

export const DEFAULT_BIBLE_VERSION: BibleVersion = 'ARA'

export function isBibleVersion(value: string): value is BibleVersion {
  return (BIBLE_VERSIONS as readonly string[]).includes(value)
}

// The entry lives as long as the process. A book file only changes when the fork is synced,
// and a sync is a maintenance act expected to reach the Painel on its next deploy — not one
// that has to overtake a cached book mid-session.
const books = new Map<string, Promise<BibleBook>>()

export function fetchBibleBook(version: BibleVersion, book: string): Promise<BibleBook> {
  const key = `${version}/${book}`
  const cached = books.get(key)
  if (cached) return cached

  const request = download(key).catch((error: unknown) => {
    books.delete(key)
    throw error
  })
  books.set(key, request)
  return request
}

async function download(key: string): Promise<BibleBook> {
  const response = await fetch(`${SOURCE}/${key}.json`, { signal: AbortSignal.timeout(10_000) })
  if (!response.ok) throw new Error(`Bible source responded with ${response.status} for ${key}`)
  return (await response.json()) as BibleBook
}
