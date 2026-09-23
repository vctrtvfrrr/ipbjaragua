import { readFile } from 'node:fs/promises'
import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

it('processes each image on a single libvips thread even when the malloc arenas are capped', async () => {
  vi.stubEnv('MALLOC_ARENA_MAX', '2')

  const { default: sharp } = await import('@/lib/sharp')

  expect(sharp.concurrency()).toBe(1)
})

it('keeps no libvips operation cache between images', async () => {
  const { default: sharp } = await import('@/lib/sharp')

  expect(sharp.cache()).toMatchObject({ memory: { max: 0 }, files: { max: 0 }, items: { max: 0 } })
})

// next.config.ts traces every libvips the lockfile resolves into the standalone bundle, so a
// sharp of our own on a different version than Next's ships a second copy of it.
it('resolves one libvips for both next/image and the uploads', async () => {
  const lockfile = await readFile('pnpm-lock.yaml', 'utf8')

  const libvipsVersions = new Set(
    lockfile.matchAll(/^ {2}'@img\/sharp-libvips-linux-x64@([^']+)':$/gm).map(([, version]) => version)
  )

  expect([...libvipsVersions]).toHaveLength(1)
})
