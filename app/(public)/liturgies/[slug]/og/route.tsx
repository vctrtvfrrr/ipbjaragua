import { getLiturgyBySlug } from '@/db/queries/liturgies'
import { formatLongDatePtBR } from '@/lib/date'
import { ogNotFound, renderLiturgyCard } from '@/lib/og/render'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  // Fetched regardless of session, then refused explicitly: a share image must never
  // render a draft, even for an operator whose cookie would otherwise unlock it elsewhere.
  const liturgy = await getLiturgyBySlug(slug, 'include-drafts')
  if (!liturgy || liturgy.status === 'draft') return ogNotFound()

  return renderLiturgyCard({
    theme: liturgy.theme,
    longDate: formatLongDatePtBR(liturgy.date),
    time: liturgy.time,
  })
}
