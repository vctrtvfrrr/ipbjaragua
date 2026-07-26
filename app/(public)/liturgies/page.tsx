import { ChurchIcon } from 'lucide-react'
import Link from 'next/link'
import { Fragment } from 'react'
import Pagination from '@/components/Pagination'
import DraftBadge from '@/components/public/DraftBadge'
import IconTile from '@/components/public/IconTile'
import PageHeader from '@/components/public/PageHeader'
import { countFutureOrTodayLiturgies, countLiturgies, listLiturgies } from '@/db/queries/liturgies'
import { getCurrentUser } from '@/lib/auth/current-user'
import { liturgySlug } from '@/lib/bulletin'
import { formatLongDatePtBR, formatTimePtBR, today } from '@/lib/date'
import { liturgyVisibilityForUser } from '@/lib/liturgy-visibility'
import { institutionalMetadata } from '@/lib/og/metadata'
import { resolvePage, totalPages } from '@/lib/pagination'

export const metadata = institutionalMetadata('liturgies')

const PAGE_SIZE = 50

export default async function LiturgiesPage({ searchParams }: PageProps<'/liturgies'>) {
  const { page: rawPage } = await searchParams
  const visibility = liturgyVisibilityForUser(await getCurrentUser())
  const total = await countLiturgies({ visibility })
  const pages = totalPages(total, PAGE_SIZE)
  const page = resolvePage(rawPage, pages)
  const todayDate = today()
  const [liturgiesList, futureCount] = await Promise.all([
    listLiturgies({ page, pageSize: PAGE_SIZE, visibility }),
    countFutureOrTodayLiturgies({ visibility, fromDate: todayDate }),
  ])
  // Absolute index of the last upcoming item across the whole date-desc sequence, so the seam is
  // found without needing both sides of it to land on the same page; -1 when there is no seam.
  const boundaryIndex = futureCount > 0 && futureCount < total ? futureCount - 1 : -1
  const pageStart = (page - 1) * PAGE_SIZE

  return (
    <main>
      <PageHeader eyebrow="Ordem dos cultos" title="Liturgias" />
      <section className="container mx-auto px-5 pt-6 pb-20 md:px-8">
        {liturgiesList.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma liturgia publicada ainda.</p>
        ) : (
          <>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {liturgiesList.map((liturgy, index) => {
                const subtitle = liturgy.description ?? liturgy.sermonDescription ?? liturgy.sermonSpeaker
                const isBoundary = pageStart + index === boundaryIndex
                return (
                  <Fragment key={liturgy.id}>
                    <li className="border-border flex gap-4 rounded-xl border p-5">
                      <IconTile icon={ChurchIcon} />
                      <div className="min-w-0">
                        <h2 className="text-brand-ridge font-serif text-2xl leading-snug">
                          <Link
                            href={`/liturgies/${liturgySlug(liturgy.date, liturgy.theme, liturgy.time)}`}
                            className="underline-offset-4 hover:underline"
                          >
                            {liturgy.theme}
                          </Link>
                          {liturgy.status === 'draft' ? <DraftBadge /> : null}
                        </h2>
                        <p className="text-brand-deep mt-1 font-bold">
                          {formatLongDatePtBR(liturgy.date)} às {formatTimePtBR(liturgy.time)}
                        </p>
                        {subtitle ? <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p> : null}
                      </div>
                    </li>
                    {isBoundary ? (
                      <li className="sm:col-span-2 lg:col-span-3">
                        <p className="eyebrow text-brand-ridge border-brand-accent border-t pt-6">Acervo</p>
                      </li>
                    ) : null}
                  </Fragment>
                )
              })}
            </ul>

            {pages > 1 ? <Pagination page={page} totalPages={pages} basePath="/liturgies" /> : null}
          </>
        )}
      </section>
    </main>
  )
}
