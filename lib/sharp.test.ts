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
