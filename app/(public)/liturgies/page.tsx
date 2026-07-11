import Link from 'next/link'
import { countLiturgies, listLiturgies } from '@/db/queries/liturgies'
import { liturgySlug } from '@/lib/bulletin'
import { formatLongDatePtBR, today } from '@/lib/date'
import { resolvePage, totalPages } from '@/lib/pagination'

const PAGE_SIZE = 50

export default async function LiturgiesPage({ searchParams }: PageProps<'/liturgies'>) {
  const { page: rawPage } = await searchParams
  const todayDate = today()
  const total = await countLiturgies({ today: todayDate })
  const pages = totalPages(total, PAGE_SIZE)
  const page = resolvePage(rawPage, pages)
  const liturgiesList = await listLiturgies({ page, pageSize: PAGE_SIZE, today: todayDate })

  return (
    <section className="container mx-auto py-10 xl:px-0">
      <h2 className="font-narrow mb-5 text-3xl text-green-900 uppercase">Liturgias</h2>
      <main>
        {liturgiesList.length === 0 ? (
          <p className="text-gray-500">Nenhuma liturgia publicada ainda.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
              {liturgiesList.map((liturgy) => {
                const subtitle = liturgy.description ?? liturgy.sermonDescription ?? liturgy.sermonSpeaker
                return (
                  <div key={liturgy.id}>
                    <Link href={`/liturgies/${liturgySlug(liturgy.date, liturgy.theme, liturgy.time)}`}>
                      <h3 className="font-narrow mt-4 mb-2 text-2xl leading-7">
                        {liturgy.theme}
                        <small className="mb-2 block font-sans text-base text-gray-500">
                          {formatLongDatePtBR(liturgy.date)}
                        </small>
                      </h3>
                    </Link>
                    {subtitle ? <p>{subtitle}</p> : null}
                  </div>
                )
              })}
            </div>

            {pages > 1 ? (
              <nav aria-label="Paginação" className="mt-10 flex items-center justify-center gap-6">
                {page > 1 ? (
                  <Link href={`/liturgies?page=${page - 1}`} className="text-green-900">
                    ← Anterior
                  </Link>
                ) : null}
                <span className="text-gray-500">
                  Página {page} de {pages}
                </span>
                {page < pages ? (
                  <Link href={`/liturgies?page=${page + 1}`} className="text-green-900">
                    Próxima →
                  </Link>
                ) : null}
              </nav>
            ) : null}
          </>
        )}
      </main>
    </section>
  )
}
