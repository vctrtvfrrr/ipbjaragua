import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ArticleWithAuthor } from '@/db/queries/articles'
import ArticleGrid from './ArticleGrid'

function makeArticle(overrides: Partial<ArticleWithAuthor> = {}): ArticleWithAuthor {
  return {
    id: 1,
    slug: 'graca-soberana',
    title: 'Graça Soberana',
    author_id: 1,
    authorName: 'Rev. Jean Carlos Almeida',
    featured_image_id: null,
    featuredImagePath: null,
    date: new Date('2026-06-07T00:00:00Z'),
    excerpt: 'Resumo do artigo.',
    content: 'corpo',
    created_at: '',
    updated_at: '',
    deleted_at: null,
    ...overrides,
  }
}

describe('ArticleGrid', () => {
  it('links each card to the article detail', () => {
    render(<ArticleGrid articles={[makeArticle()]} />)

    expect(screen.getByRole('link', { name: /Graça Soberana/ })).toHaveAttribute('href', '/articles/graca-soberana')
  })

  it('shows the excerpt when present', () => {
    render(<ArticleGrid articles={[makeArticle({ excerpt: 'Resumo do artigo.' })]} />)

    expect(screen.getByText('Resumo do artigo.')).toBeInTheDocument()
  })

  it('omits the excerpt paragraph when empty', () => {
    render(<ArticleGrid articles={[makeArticle({ excerpt: null })]} />)

    expect(screen.queryByText('Resumo do artigo.')).not.toBeInTheDocument()
  })

  it('shows an empty-state message when there are no articles', () => {
    render(<ArticleGrid articles={[]} />)

    expect(screen.getByText(/Nenhum artigo publicado ainda/i)).toBeInTheDocument()
  })

  it('offers a next-page link but no previous on the first page', () => {
    render(<ArticleGrid articles={[makeArticle()]} pagination={{ page: 1, totalPages: 3, basePath: '/articles' }} />)

    const nav = screen.getByRole('navigation')
    expect(within(nav).getByRole('link', { name: /próxima/i })).toHaveAttribute('href', '/articles?page=2')
    expect(within(nav).queryByRole('link', { name: /anterior/i })).not.toBeInTheDocument()
  })

  it('hides pagination entirely on a single page', () => {
    render(<ArticleGrid articles={[makeArticle()]} pagination={{ page: 1, totalPages: 1, basePath: '/articles' }} />)

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('hides pagination when the caller asks for none', () => {
    render(<ArticleGrid articles={[makeArticle()]} />)

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })
})
