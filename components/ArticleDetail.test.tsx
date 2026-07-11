import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ArticleWithAuthor } from '@/db/queries/articles'
import ArticleDetail from './ArticleDetail'

const baseArticle: ArticleWithAuthor = {
  id: 1,
  slug: 'graca-soberana',
  title: 'Graça Soberana',
  author_id: 1,
  authorName: 'Rev. Jean Carlos Almeida',
  featured_image_id: null,
  featuredImagePath: null,
  date: new Date('2026-06-07T00:00:00Z'),
  excerpt: null,
  content: 'Olá **mundo**',
  created_at: '',
  updated_at: '',
  deleted_at: null,
}

describe('ArticleDetail', () => {
  it('shows the title as a heading', () => {
    render(<ArticleDetail article={baseArticle} />)

    expect(screen.getByRole('heading', { name: 'Graça Soberana' })).toBeInTheDocument()
  })

  it('shows the byline with author and formatted date', () => {
    render(<ArticleDetail article={baseArticle} />)

    expect(screen.getByText('Rev. Jean Carlos Almeida — 07 de junho de 2026')).toBeInTheDocument()
  })

  it('falls back to "Redação" when the author has no name', () => {
    render(<ArticleDetail article={{ ...baseArticle, authorName: null }} />)

    expect(screen.getByText('Redação — 07 de junho de 2026')).toBeInTheDocument()
  })

  it('renders the markdown content', () => {
    render(<ArticleDetail article={baseArticle} />)

    const strong = screen.getByText('mundo')
    expect(strong.tagName).toBe('STRONG')
  })
})
