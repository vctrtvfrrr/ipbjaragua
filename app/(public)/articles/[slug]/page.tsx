import { notFound } from 'next/navigation'
import { cache } from 'react'
import ArticleDetail from '@/components/ArticleDetail'
import { getArticleBySlug } from '@/db/queries/articles'
import { articleMetadata } from '@/lib/og/metadata'

const loadArticle = cache((slug: string) => getArticleBySlug(slug))

export async function generateMetadata({ params }: PageProps<'/articles/[slug]'>) {
  const { slug } = await params
  const article = await loadArticle(slug)
  if (!article) return {}
  return articleMetadata({ slug, title: article.title, excerpt: article.excerpt, date: article.date })
}

export default async function ArticleDetailsPage({ params }: PageProps<'/articles/[slug]'>) {
  const { slug } = await params
  const article = await loadArticle(slug)

  if (!article) {
    notFound()
  }

  return <ArticleDetail article={article} />
}
