import { getLiturgyBySlug } from '@/db/queries/liturgies'
import { formatLongDatePtBR } from '@/lib/date'
import { ogNotFound, renderLiturgyCard } from '@/lib/og/render'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const liturgy = await getLiturgyBySlug(slug, 'published-only')
  if (!liturgy) return ogNotFound()

  return renderLiturgyCard({
    theme: liturgy.theme,
    longDate: formatLongDatePtBR(liturgy.date),
    time: liturgy.time,
  })
}
