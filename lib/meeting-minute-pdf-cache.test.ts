import { mkdtemp, readdir, rm, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  meetingMinutePdfCacheExists,
  newMeetingMinutePdfCacheName,
  readMeetingMinutePdfCache,
  writeMeetingMinutePdfCache,
} from './meeting-minute-pdf-cache'

let storagePath: string

function cacheDirectory(): string {
  return path.join(storagePath, 'meeting-minute-pdfs')
}

beforeEach(async () => {
  storagePath = await mkdtemp(path.join(tmpdir(), 'meeting-minute-pdf-cache-'))
  process.env.MEDIA_STORAGE_PATH = storagePath
})

afterEach(async () => {
  delete process.env.MEDIA_STORAGE_PATH
  await rm(storagePath, { recursive: true, force: true })
})

describe('the PDF cache of an Ata Aprovada', () => {
  it('gives back the bytes it stored', async () => {
    const name = newMeetingMinutePdfCacheName()

    await writeMeetingMinutePdfCache(name, Buffer.from('%PDF-1.7 primeira'))

    expect(await meetingMinutePdfCacheExists(name)).toBe(true)
    expect((await readMeetingMinutePdfCache(name))?.toString()).toBe('%PDF-1.7 primeira')
  })

  it('reads a cache that was never written as absent', async () => {
    const name = newMeetingMinutePdfCacheName()

    expect(await meetingMinutePdfCacheExists(name)).toBe(false)
    expect(await readMeetingMinutePdfCache(name)).toBeNull()
    expect(await readMeetingMinutePdfCache(null)).toBeNull()
  })

  it('reads a file the volume lost as absent, path and all', async () => {
    const name = newMeetingMinutePdfCacheName()
    await writeMeetingMinutePdfCache(name, Buffer.from('%PDF-1.7 perdida'))

    await unlink(path.join(cacheDirectory(), name))

    expect(await meetingMinutePdfCacheExists(name)).toBe(false)
    expect(await readMeetingMinutePdfCache(name)).toBeNull()
  })

  it('replaces the bytes in place, keeping neither history nor leftovers', async () => {
    const name = newMeetingMinutePdfCacheName()
    await writeMeetingMinutePdfCache(name, Buffer.from('%PDF-1.7 primeira'))

    await writeMeetingMinutePdfCache(name, Buffer.from('%PDF-1.7 segunda'))

    expect((await readMeetingMinutePdfCache(name))?.toString()).toBe('%PDF-1.7 segunda')
    expect(await readdir(cacheDirectory())).toEqual([name])
  })

  it('lets the last of two simultaneous writes stand, without a half-written file', async () => {
    const name = newMeetingMinutePdfCacheName()

    await Promise.all([
      writeMeetingMinutePdfCache(name, Buffer.from('%PDF-1.7 primeira')),
      writeMeetingMinutePdfCache(name, Buffer.from('%PDF-1.7 segunda')),
    ])

    expect(['%PDF-1.7 primeira', '%PDF-1.7 segunda']).toContain((await readMeetingMinutePdfCache(name))?.toString())
    expect(await readdir(cacheDirectory())).toEqual([name])
  })

  it('refuses a name the application did not mint', async () => {
    await expect(writeMeetingMinutePdfCache('../escape.pdf', Buffer.from('%PDF-1.7'))).rejects.toThrow()
    expect(await readMeetingMinutePdfCache('../../etc/passwd')).toBeNull()
    expect(await meetingMinutePdfCacheExists('../../etc/passwd')).toBe(false)
  })
})
