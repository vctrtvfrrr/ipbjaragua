import { describe, expect, it } from 'vitest'
import { OG_CONTENT_TYPE, OG_SIZE } from './config'
import { ogNotFound, renderArticleCard, renderIdentityCard } from './render'

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47]

async function readMagic(response: Response): Promise<number[]> {
  const buffer = await response.arrayBuffer()
  return Array.from(new Uint8Array(buffer.slice(0, 4)))
}

describe('OG image dimensions', () => {
  it('is a 1200x630 PNG', () => {
    expect(OG_SIZE).toEqual({ width: 1200, height: 630 })
    expect(OG_CONTENT_TYPE).toBe('image/png')
  })
})

describe('renderArticleCard', () => {
  it('renders a PNG response', async () => {
    const response = await renderArticleCard({ title: 'A graça de Deus', longDate: '01 de março de 2026' })
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('image/png')
    expect(await readMagic(response)).toEqual(PNG_MAGIC)
  })

  it('renders extremely long titles without failing', async () => {
    const response = await renderArticleCard({ title: 'Palavra '.repeat(40).trim(), longDate: '01 de março de 2026' })
    expect(await readMagic(response)).toEqual(PNG_MAGIC)
  })
})

describe('renderIdentityCard', () => {
  it('renders the home identity PNG', async () => {
    const response = await renderIdentityCard()
    expect(await readMagic(response)).toEqual(PNG_MAGIC)
  })
})

describe('ogNotFound', () => {
  it('returns a 404 response', () => {
    expect(ogNotFound().status).toBe(404)
  })
})
