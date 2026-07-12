import { INSTITUTIONAL_PAGES, isInstitutionalPageKey } from '@/lib/og/pages'
import { ogNotFound, renderIdentityCard, renderInstitutionalCard } from '@/lib/og/render'

export function generateStaticParams() {
  return Object.keys(INSTITUTIONAL_PAGES).map((page) => ({ page }))
}

export async function GET(_request: Request, ctx: { params: Promise<{ page: string }> }) {
  const { page } = await ctx.params
  if (!isInstitutionalPageKey(page)) return ogNotFound()
  if (page === 'home') return renderIdentityCard()

  const { cardLabel, name } = INSTITUTIONAL_PAGES[page]
  return renderInstitutionalCard(cardLabel ?? name)
}
