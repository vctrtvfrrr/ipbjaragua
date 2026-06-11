import { notFound } from 'next/navigation'
import ArticleDetail from '@/components/ArticleDetail'
import { getArticleBySlug } from '@/db/queries/articles'

export async function generateMetadata({ params }: PageProps<'/articles/[slug]'>) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  return { title: article?.title }
}

export default async function ArticleDetailsPage({ params }: PageProps<'/articles/[slug]'>) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)

  if (!article) {
    notFound()
  }

  return <ArticleDetail article={article} />
}
