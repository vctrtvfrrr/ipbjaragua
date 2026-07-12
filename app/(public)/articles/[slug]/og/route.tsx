import { getArticleBySlug } from '@/db/queries/articles'
import { formatLongDatePtBR } from '@/lib/date'
import { ogNotFound, renderArticleCard } from '@/lib/og/render'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const article = await getArticleBySlug(slug)
  if (!article) return ogNotFound()

  return renderArticleCard({ title: article.title, longDate: formatLongDatePtBR(article.date) })
}
