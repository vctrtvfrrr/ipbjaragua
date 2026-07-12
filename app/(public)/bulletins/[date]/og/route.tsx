import { getBulletinByDate } from '@/db/queries/bulletins'
import { formatBulletinSubtitle } from '@/lib/bulletin'
import { formatLongDatePtBR, parseISODate, today } from '@/lib/date'
import { ogNotFound, renderBulletinCard } from '@/lib/og/render'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, ctx: { params: Promise<{ date: string }> }) {
  const { date } = await ctx.params
  const isPreview = new URL(request.url).searchParams.get('preview') === '1'
  const todayDate = today()
  const result = await getBulletinByDate(parseISODate(date), todayDate, undefined, { preview: isPreview })
  if (!result) return ogNotFound()

  const { bulletin } = result
  return renderBulletinCard({
    title: bulletin.title,
    longDate: formatLongDatePtBR(bulletin.date),
    subtitle: formatBulletinSubtitle(bulletin.edition, bulletin.date),
    draft: bulletin.date > todayDate,
  })
}
