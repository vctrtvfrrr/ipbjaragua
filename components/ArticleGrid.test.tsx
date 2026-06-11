import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Article } from '@/db/queries/articles'
import ArticleGrid from './ArticleGrid'

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: 1,
    slug: 'graca-soberana',
    title: 'Graça Soberana',
    author: 'Rev. Jean Carlos Almeida',
    date: '2026-06-07',
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
    render(<ArticleGrid articles={[makeArticle()]} page={1} totalPages={1} basePath="/articles" />)

    expect(screen.getByRole('link', { name: /Graça Soberana/ })).toHaveAttribute('href', '/articles/graca-soberana')
  })

  it('shows the excerpt when present', () => {
    render(<ArticleGrid articles={[makeArticle({ excerpt: 'Resumo do artigo.' })]} page={1} totalPages={1} basePath="/articles" />)

    expect(screen.getByText('Resumo do artigo.')).toBeInTheDocument()
  })

  it('omits the excerpt paragraph when empty', () => {
    render(<ArticleGrid articles={[makeArticle({ excerpt: null })]} page={1} totalPages={1} basePath="/articles" />)

    expect(screen.queryByText('Resumo do artigo.')).not.toBeInTheDocument()
  })

  it('shows an empty-state message when there are no articles', () => {
    render(<ArticleGrid articles={[]} page={1} totalPages={1} basePath="/articles" />)

    expect(screen.getByText(/Nenhum artigo publicado ainda/i)).toBeInTheDocument()
  })

  it('offers a next-page link but no previous on the first page', () => {
    render(<ArticleGrid articles={[makeArticle()]} page={1} totalPages={3} basePath="/articles" />)

    const nav = screen.getByRole('navigation')
    expect(within(nav).getByRole('link', { name: /próxima/i })).toHaveAttribute('href', '/articles?page=2')
    expect(within(nav).queryByRole('link', { name: /anterior/i })).not.toBeInTheDocument()
  })

  it('hides pagination entirely on a single page', () => {
    render(<ArticleGrid articles={[makeArticle()]} page={1} totalPages={1} basePath="/articles" />)

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })
})
