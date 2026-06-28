import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Article } from '@/db/queries/articles'
import ArticleDetail from './ArticleDetail'

const baseArticle: Article = {
  id: 1,
  slug: 'graca-soberana',
  title: 'Graça Soberana',
  author: 'Rev. Jean Carlos Almeida',
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

  it('omits the author from the byline when there is none', () => {
    render(<ArticleDetail article={{ ...baseArticle, author: null }} />)

    expect(screen.getByText('07 de junho de 2026')).toBeInTheDocument()
    expect(screen.queryByText(/—/)).not.toBeInTheDocument()
  })

  it('renders the markdown content', () => {
    render(<ArticleDetail article={baseArticle} />)

    const strong = screen.getByText('mundo')
    expect(strong.tagName).toBe('STRONG')
  })
})
