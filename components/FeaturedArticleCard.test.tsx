import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Article } from '@/db/queries/articles'
import FeaturedArticleCard from './FeaturedArticleCard'

const article: Article = {
  id: 1,
  slug: 'graca-soberana',
  title: 'Graça Soberana',
  author: 'Rev. Jean Carlos Almeida',
  date: '2026-06-07',
  excerpt: null,
  content: 'corpo',
  created_at: '',
  updated_at: '',
  deleted_at: null,
}

describe('FeaturedArticleCard', () => {
  it('shows the article title, author and links to its detail', () => {
    render(<FeaturedArticleCard article={article} />)

    expect(screen.getByRole('heading', { name: 'Graça Soberana' })).toBeInTheDocument()
    expect(screen.getByText('Rev. Jean Carlos Almeida')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/articles/graca-soberana')
  })

  it('renders nothing when there is no article', () => {
    const { container } = render(<FeaturedArticleCard article={undefined} />)

    expect(container).toBeEmptyDOMElement()
  })
})
