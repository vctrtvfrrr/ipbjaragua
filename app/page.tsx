import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import ArticleGrid from '@/components/ArticleGrid'
import FeaturedArticleCard from '@/components/FeaturedArticleCard'
import { listActiveAnnouncements, listAgendaInWindow } from '@/db/queries/bulletin-sections'
import { getLatestDominicalBulletin, listRecentBulletins } from '@/db/queries/bulletins'
import { countArticles, getLatestArticle, listArticles } from '@/db/queries/articles'
import { formatBulletinSubtitle, groupAgendaByWeekday } from '@/lib/bulletin'
import { currentWeekWindow, formatLongDatePtBR, todayISO } from '@/lib/date'
import { resolvePage, totalPages } from '@/lib/pagination'

const PAGE_SIZE = 12

export default async function Home({ searchParams }: PageProps<'/'>) {
  const { page: rawPage } = await searchParams
  const today = todayISO()
  const weekWindow = currentWeekWindow(today)
  const [latest, total, agendaItems, announcements, recentBulletins, dominicalBulletin] = await Promise.all([
    getLatestArticle(),
    countArticles(),
    listAgendaInWindow(weekWindow.from, weekWindow.to),
    listActiveAnnouncements(today),
    listRecentBulletins({ today, limit: 5 }),
    getLatestDominicalBulletin(today),
  ])
  const pages = totalPages(total, PAGE_SIZE)
  const page = resolvePage(rawPage, pages)
  const articles = await listArticles({ page, pageSize: PAGE_SIZE })
  const agendaDays = groupAgendaByWeekday(agendaItems)

  return (
    <>
      <div className="bg-gray-100">
        <div className="container mx-auto px-4 py-10 xl:px-0">
          <ul className="-mx-4 flex flex-wrap overflow-hidden">
            <li className="my-2 w-full overflow-hidden px-2 md:w-1/3 lg:w-1/3 xl:w-1/3">
              <FeaturedArticleCard article={latest} />
            </li>
            <li className="my-2 w-full overflow-hidden px-2 md:w-1/3 lg:w-1/3 xl:w-1/3">
              <Link href="/liturgies/2026-06-07-culto-solene">
                <div
                  className="relative mx-2 flex items-center justify-center overflow-hidden rounded bg-gray-300 bg-cover bg-center"
                  style={{
                    height: '260px',
                    backgroundImage: 'url(/images/featured-image.png)',
                  }}
                >
                  <div className="absolute z-10 h-full w-full bg-black opacity-50"></div>
                  <div className="relative z-20 p-5 text-center">
                    <span className="inline-block text-xs tracking-wide text-white uppercase">Liturgia</span>
                    <h2 className="my-5 font-serif text-xl font-semibold text-white">Culto Solene ao Bondoso Senhor</h2>
                    <span className="inline-block font-sans text-xs text-white">Rev. Josiel de Matos</span>
                  </div>
                </div>
              </Link>
            </li>
            {dominicalBulletin ? (
              <li className="my-2 w-full overflow-hidden px-2 md:w-1/3 lg:w-1/3 xl:w-1/3">
                <Link href={`/bulletins/${dominicalBulletin.date}`}>
                  <div
                    className="relative mx-2 flex items-center justify-center overflow-hidden rounded bg-gray-300 bg-cover bg-center"
                    style={{
                      height: '260px',
                      backgroundImage: 'url(/images/featured-image.png)',
                    }}
                  >
                    <div className="absolute z-10 h-full w-full bg-black opacity-50"></div>
                    <div className="relative z-20 p-5 text-center">
                      <span className="inline-block text-xs tracking-wide text-white uppercase">Boletim Semanal</span>
                      <h2 className="my-5 font-serif text-xl font-semibold text-white">
                        {formatBulletinSubtitle(dominicalBulletin.edition, dominicalBulletin.date)}
                      </h2>
                      <span className="inline-block font-sans text-xs text-white">
                        {formatLongDatePtBR(dominicalBulletin.date)}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="container mx-auto flex flex-wrap gap-8 px-4 py-10 xl:px-0">
        <main className="md:flex-1 lg:flex-2 xl:flex-3">
          <h2 className="font-narrow mb-5 text-3xl text-green-900 uppercase">Artigos</h2>
          <ArticleGrid articles={articles} page={page} totalPages={pages} basePath="/" />
        </main>

        <aside className="mt-10 md:mt-0 md:flex-1">
          <div className="w-full overflow-hidden">
            <div className="mr-2 ml-2 space-y-12 md:ml-4">
              <div className="hidden">
                <div className="relative overflow-hidden rounded-sm border">
                  <form className="flex">
                    <input
                      className="relative w-full border-0 p-5 font-light text-gray-900"
                      type="text"
                      name="s"
                      title="Busque no site"
                      placeholder="Pesquisar..."
                    />
                    <button type="submit" aria-label="Pesquisar" className="border-0 bg-transparent px-5 py-5">
                      <span className="block w-5">
                        <svg
                          aria-hidden="true"
                          className="fill-current"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 512 512"
                        >
                          <path d="M495 466.2L377.2 348.4c29.2-35.6 46.8-81.2 46.8-130.9C424 103.5 331.5 11 217.5 11 103.4 11 11 103.5 11 217.5S103.4 424 217.5 424c49.7 0 95.2-17.5 130.8-46.7L466.1 495c8 8 20.9 8 28.9 0 8-7.9 8-20.9 0-28.8zm-277.5-83.3C126.2 382.9 52 308.7 52 217.5S126.2 52 217.5 52C308.7 52 383 126.3 383 217.5s-74.3 165.4-165.5 165.4z" />
                        </svg>
                      </span>
                    </button>
                  </form>
                </div>
              </div>

              <div className="hidden rounded bg-gray-100 p-4">
                <div className="pb-6">
                  <div className="mx-auto mt-6 w-10 text-gray-900">
                    <svg
                      aria-hidden="true"
                      className="fill-current"
                      viewBox="-1 0 512 512"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M505.668 246.465c-.89-.906-54.297-54.309-55.668-55.68V55c0-30.328-24.672-55-55-55H115C84.672 0 60 24.672 60 55v135.785C.379 250.406 0 248.301 0 257v210c0 24.813 20.188 45 45 45h420c24.813 0 45-20.188 45-45V257c0-3.855-1.54-7.71-4.332-10.535zm-35.992 6.426L450 262.73v-29.516zM115 30h280c13.785 0 25 11.215 25 25v222.73l-120 60V197c0-8.285-6.715-15-15-15H135c-8.285 0-15 6.715-15 15v95.73l-30-15V55c0-13.785 11.215-25 25-25zm155 257.973l-66.68-44.453a15.004 15.004 0 00-15.027-.938L150 261.73V212h120zm-120 7.297l43.922-21.961L270 324.027v28.703l-15 7.5-105-52.5zm-90-32.54l-19.676-9.84L60 233.216zM465 482H45c-8.27 0-15-6.73-15-15V281.27l218.293 109.148a15.008 15.008 0 0013.414 0L480 281.27V467c0 8.27-6.73 15-15 15zm0 0" />
                      <path d="M195 91h120c8.285 0 15-6.715 15-15s-6.715-15-15-15H195c-8.285 0-15 6.715-15 15s6.715 15 15 15zm0 0M135 151h240c8.285 0 15-6.715 15-15s-6.715-15-15-15H135c-8.285 0-15 6.715-15 15s6.715 15 15 15zm0 0M375 181h-30c-8.285 0-15 6.715-15 15s6.715 15 15 15h30c8.285 0 15-6.715 15-15s-6.715-15-15-15zm0 0M375 241h-30c-8.285 0-15 6.715-15 15s6.715 15 15 15h30c8.285 0 15-6.715 15-15s-6.715-15-15-15zm0 0" />
                    </svg>
                  </div>
                  <h2 className="mb-2 pt-5 text-center text-xl font-light text-gray-900">
                    Assine nosso Boletim Semanal
                  </h2>
                  <span className="block text-center text-xs leading-loose font-thin tracking-wider text-gray-900 italic">
                    Receba-os diretamente em sua caixa de entrada!
                  </span>
                  <form>
                    <div className="mt-5 overflow-hidden rounded-sm border border-gray-400 bg-white">
                      <input
                        className="w-full bg-transparent p-3"
                        type="text"
                        name="name"
                        placeholder="Nome completo"
                      />
                    </div>
                    <div className="mt-3 overflow-hidden rounded-sm border border-gray-400 bg-white">
                      <input
                        className="w-full bg-transparent p-3"
                        type="email"
                        name="email"
                        placeholder="Endereço de e-mail"
                      />
                    </div>
                    <div className="mt-3 text-xs leading-loose tracking-wider text-gray-900 italic">
                      <span className="inline-block pr-1">
                        <input type="checkbox" name="" id="privacy-check" />
                      </span>
                      <label htmlFor="privacy-check">
                        Concordo com a{' '}
                        <Link href="" className="text-green-500">
                          Política de Privacidade
                        </Link>
                        .
                      </label>
                    </div>
                    <button
                      type="submit"
                      className="mt-5 w-full rounded-sm bg-gray-900 py-3 text-sm font-medium tracking-widest text-white uppercase"
                    >
                      Assinar
                    </button>
                  </form>
                </div>
              </div>

              {agendaDays.length > 0 ? (
                <div>
                  <h2 className="font-narrow mb-5 text-center text-3xl text-green-900 uppercase">Agenda da Semana</h2>
                  <ol className="space-y-6">
                    {agendaDays.map((day) => (
                      <li key={day.weekday}>
                        <h3 className="font-narrow text-xl font-bold">
                          <span className="text-red-500">‣</span> {day.label}
                        </h3>
                        <ul>
                          {day.items.map((item) => (
                            <li key={item.id}>
                              {item.time ? (
                                <>
                                  <time>{item.time}</time> – {item.title}
                                </>
                              ) : (
                                item.title
                              )}
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}

              {announcements.length > 0 ? (
                <div>
                  <h2 className="font-narrow mb-5 text-center text-3xl text-green-900 uppercase">Avisos Gerais</h2>
                  <ul className="space-y-6">
                    {announcements.map((ann) => (
                      <li key={ann.id}>
                        <h3 className="font-narrow text-2xl font-bold">{ann.title}</h3>
                        {ann.description ? (
                          <div className="text-justify">
                            <ReactMarkdown>{ann.description}</ReactMarkdown>
                          </div>
                        ) : null}
                        {ann.url ? <Link href={ann.url}>Acesse</Link> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {recentBulletins.length > 0 ? (
                <div className="rounded bg-gray-100 p-4">
                  <h2 className="font-narrow mb-5 text-center text-3xl text-green-900 uppercase">
                    Boletins Publicados
                  </h2>
                  <ul className="space-y-6">
                    {recentBulletins.map((b) => (
                      <li key={b.id}>
                        <Link href={`/bulletins/${b.date}`}>
                          <h3 className="font-narrow text-xl font-bold">{formatLongDatePtBR(b.date)}</h3>
                          <p className="font-sans text-gray-500">{formatBulletinSubtitle(b.edition, b.date)}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
