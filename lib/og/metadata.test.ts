import { describe, expect, it } from 'vitest'
import { formatBulletinSubtitle } from '@/lib/bulletin'
import { formatLongDatePtBR, parseISODate } from '@/lib/date'
import { articleMetadata, bulletinMetadata, institutionalMetadata, liturgyMetadata } from './metadata'

const d = (iso: string) => parseISODate(iso)

describe('institutionalMetadata', () => {
  it('renders the home card as identity only with an absolute title', () => {
    const meta = institutionalMetadata('home')
    expect(meta.title).toEqual({ absolute: 'IPB de Jaraguá do Sul' })
    expect(meta.description).toBeTruthy()
    expect(meta.alternates?.canonical).toBe('/')
    expect(meta.openGraph?.images).toEqual([
      { url: '/og/home', width: 1200, height: 630, alt: expect.stringContaining('Início') },
    ])
  })

  it('names inner pages and points to their generated image', () => {
    const meta = institutionalMetadata('about')
    expect(meta.title).toBe('Sobre nós')
    expect(meta.openGraph?.title).toBe('Sobre nós — IPB de Jaraguá do Sul')
    expect(meta.alternates?.canonical).toBe('/about')
    const image = (meta.openGraph?.images as Array<{ url: string; alt: string }>)[0]
    expect(image.url).toBe('/og/about')
    expect(image.alt).toBe('Imagem de compartilhamento da página Sobre nós da IPB de Jaraguá do Sul')
  })

  it('reuses the same image in openGraph and twitter', () => {
    const meta = institutionalMetadata('liturgies')
    const og = (meta.openGraph?.images as Array<{ url: string }>)[0]
    const tw = (meta.twitter?.images as Array<{ url: string }>)[0]
    expect(tw.url).toBe(og.url)
    expect((meta.twitter as { card?: string }).card).toBe('summary_large_image')
  })
})

describe('articleMetadata', () => {
  const base = { slug: 'a-graca-de-deus', title: 'A graça de Deus', date: d('2026-03-01') }

  it('uses the excerpt as description when present', () => {
    const meta = articleMetadata({ ...base, excerpt: 'Um resumo pastoral.' })
    expect(meta.description).toBe('Um resumo pastoral.')
    expect(meta.openGraph?.description).toBe('Um resumo pastoral.')
  })

  it('omits the description when there is no excerpt', () => {
    const meta = articleMetadata({ ...base, excerpt: null })
    expect(meta.description).toBeUndefined()
    expect(meta.openGraph?.description).toBeUndefined()
  })

  it('marks the card as an article and links canonical + image by slug', () => {
    const meta = articleMetadata({ ...base, excerpt: null })
    expect((meta.openGraph as { type?: string }).type).toBe('article')
    expect(meta.alternates?.canonical).toBe('/articles/a-graca-de-deus')
    const image = (meta.openGraph?.images as Array<{ url: string; alt: string }>)[0]
    expect(image.url).toBe('/articles/a-graca-de-deus/og')
    expect(image.alt).toBe('Imagem de compartilhamento do Artigo A graça de Deus')
  })
})

describe('bulletinMetadata', () => {
  const bulletin = { date: d('2025-02-09'), slug: '2025-02-09', title: 'Culto de Abertura', edition: 1 }

  it('describes a published bulletin with edition and year', () => {
    const meta = bulletinMetadata(bulletin)
    const expected = `${formatBulletinSubtitle(1, bulletin.date)} — ${formatLongDatePtBR(bulletin.date)}`
    expect(meta.description).toBe(expected)
    expect(meta.robots).toBeUndefined()
    expect(meta.alternates?.canonical).toBe('/bulletins/2025-02-09')
    const image = (meta.openGraph?.images as Array<{ url: string }>)[0]
    expect(image.url).toBe('/bulletins/2025-02-09/og')
  })

  it('makes a preview noindex, drops canonical and marks the image as a draft', () => {
    const meta = bulletinMetadata(bulletin, { preview: true })
    expect(meta.robots).toEqual({ index: false, follow: false })
    expect(meta.alternates).toBeUndefined()
    const image = (meta.openGraph?.images as Array<{ url: string; alt: string }>)[0]
    expect(image.url).toBe('/bulletins/2025-02-09/og?preview=1')
    expect(image.alt).toMatch(/em Rascunho$/)
  })
})

describe('liturgyMetadata', () => {
  const base = { slug: '2026-06-07-culto-solene', theme: 'Culto Solene', time: '19:00', date: d('2026-06-07') }

  it('always includes the mandatory time in the title', () => {
    const meta = liturgyMetadata({ ...base, description: null })
    expect(meta.title).toBe('Culto Solene — 07 de junho de 2026 às 19h00')
    expect(meta.description).toBeUndefined()
  })

  it('uses the description when present', () => {
    const meta = liturgyMetadata({ ...base, description: 'Culto de gratidão.' })
    expect(meta.description).toBe('Culto de gratidão.')
    const image = (meta.openGraph?.images as Array<{ url: string; alt: string }>)[0]
    expect(image.url).toBe('/liturgies/2026-06-07-culto-solene/og')
    expect(image.alt).toBe('Imagem de compartilhamento da Liturgia Culto Solene, de 07 de junho de 2026')
  })
})
