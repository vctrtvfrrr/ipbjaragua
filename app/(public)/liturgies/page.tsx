import Link from 'next/link'
import { Fragment } from 'react'
import Pagination from '@/components/Pagination'
import PageHeader from '@/components/public/PageHeader'
import { countFutureOrTodayLiturgies, countLiturgies, listLiturgies } from '@/db/queries/liturgies'
import { liturgySlug } from '@/lib/bulletin'
import { formatLongDatePtBR, formatTimePtBR, today } from '@/lib/date'
import { institutionalMetadata } from '@/lib/og/metadata'
import { resolvePage, totalPages } from '@/lib/pagination'

export const metadata = institutionalMetadata('liturgies')

const PAGE_SIZE = 50

export default async function LiturgiesPage({ searchParams }: PageProps<'/liturgies'>) {
  const { page: rawPage } = await searchParams
  const total = await countLiturgies({ visibility: 'published-only' })
  const pages = totalPages(total, PAGE_SIZE)
  const page = resolvePage(rawPage, pages)
  const todayDate = today()
  const [liturgiesList, futureCount] = await Promise.all([
    listLiturgies({ page, pageSize: PAGE_SIZE, visibility: 'published-only' }),
    countFutureOrTodayLiturgies({ visibility: 'published-only', fromDate: todayDate }),
  ])
  // Índice absoluto (na sequência ordenada por data desc) do último item futuro/hoje; -1 quando
  // não há fronteira nesta lista (tudo futuro ou tudo passado), para não depender de dois itens
  // adjacentes caírem na mesma página.
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
            <ul className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {liturgiesList.map((liturgy, index) => {
                const subtitle = liturgy.description ?? liturgy.sermonDescription ?? liturgy.sermonSpeaker
                const isBoundary = pageStart + index === boundaryIndex
                return (
                  <Fragment key={liturgy.id}>
                    <li className="border-border border-b pb-5">
                      <Link
                        href={`/liturgies/${liturgySlug(liturgy.date, liturgy.theme, liturgy.time)}`}
                        className="group block"
                      >
                        <h2 className="text-brand-ridge font-serif text-2xl leading-snug group-hover:underline">
                          {liturgy.theme}
                        </h2>
                        <p className="font-narrow text-brand-deep mt-2 tracking-[0.06em] uppercase">
                          {formatLongDatePtBR(liturgy.date)} às {formatTimePtBR(liturgy.time)}
                        </p>
                      </Link>
                      {subtitle ? <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p> : null}
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
