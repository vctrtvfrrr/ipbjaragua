import Link from 'next/link'
import Pagination from '@/components/Pagination'
import PageHeader from '@/components/public/PageHeader'
import { countLiturgies, listLiturgies } from '@/db/queries/liturgies'
import { liturgySlug } from '@/lib/bulletin'
import { formatLongDatePtBR, formatTimePtBR, today } from '@/lib/date'
import { institutionalMetadata } from '@/lib/og/metadata'
import { resolvePage, totalPages } from '@/lib/pagination'

export const metadata = institutionalMetadata('liturgies')

const PAGE_SIZE = 50

export default async function LiturgiesPage({ searchParams }: PageProps<'/liturgies'>) {
  const { page: rawPage } = await searchParams
  const todayDate = today()
  const total = await countLiturgies({ today: todayDate })
  const pages = totalPages(total, PAGE_SIZE)
  const page = resolvePage(rawPage, pages)
  const liturgiesList = await listLiturgies({ page, pageSize: PAGE_SIZE, today: todayDate })

  return (
    <main>
      <PageHeader eyebrow="Ordem dos cultos" title="Liturgias" />
      <section className="container mx-auto px-5 pt-6 pb-20 md:px-8">
        {liturgiesList.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma liturgia publicada ainda.</p>
        ) : (
          <>
            <ul className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {liturgiesList.map((liturgy) => {
                const subtitle = liturgy.description ?? liturgy.sermonDescription ?? liturgy.sermonSpeaker
                return (
                  <li key={liturgy.id} className="border-border border-b pb-5">
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
