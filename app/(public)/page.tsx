import { CalendarIcon, ChevronRightIcon } from 'lucide-react'
import Link from 'next/link'
import ArticleGrid from '@/components/ArticleGrid'
import HeroScene from '@/components/brand/HeroScene'
import PublicationTile from '@/components/brand/PublicationTile'
import Markdown from '@/components/Markdown'
import ArticleVisual from '@/components/public/ArticleVisual'
import SectionHead from '@/components/public/SectionHead'
import { buttonVariants } from '@/components/ui/button'
import { countArticles, getLatestArticle, listArticles } from '@/db/queries/articles'
import { listActiveAnnouncements, listAgendaInWindow } from '@/db/queries/bulletin-sections'
import { getLatestDominicalBulletin, listRecentBulletins } from '@/db/queries/bulletins'
import { getNextLiturgy, type NextLiturgyResult } from '@/db/queries/liturgies'
import { publicAuthorName } from '@/lib/article'
import { formatBulletinSubtitle, groupAgendaByWeekday, liturgySlug } from '@/lib/bulletin'
import {
  currentTimeHHMM,
  currentWeekWindow,
  formatISODate,
  formatLongDatePtBR,
  formatShortDatePtBR,
  formatTimePtBR,
  formatWeekdayPtBR,
  today,
} from '@/lib/date'
import { CHURCH_NAME } from '@/lib/og/config'
import { institutionalMetadata } from '@/lib/og/metadata'
import { resolvePage, totalPages } from '@/lib/pagination'
import { cn } from '@/lib/utils'

export const metadata = institutionalMetadata('home')

const PAGE_SIZE = 12

const NEXT_LITURGY_EYEBROW: Record<NextLiturgyResult['kind'], string> = {
  today: 'Culto de hoje',
  future: 'Próximo culto',
  'last-held': 'Último culto',
}

function VisitLink() {
  return (
    <Link
      href="/location"
      className="text-brand-deep inline-flex min-h-11 items-center gap-1.5 font-bold underline-offset-4 hover:underline"
    >
      Planeje sua visita
      <ChevronRightIcon aria-hidden="true" className="size-4" />
    </Link>
  )
}

function NextService({ next }: { next: NextLiturgyResult }) {
  const { liturgy, kind } = next
  const lastHeld = kind === 'last-held'
  const when = [formatWeekdayPtBR(liturgy.date), formatLongDatePtBR(liturgy.date)].join(', ')

  return (
    <>
      <p className="eyebrow text-brand-ridge">{NEXT_LITURGY_EYEBROW[kind]}</p>
      <h1 className="text-display text-brand-ridge mt-4 font-serif">{liturgy.theme}</h1>
      <p className="text-brand-deep mt-5 flex items-center gap-2.5 text-xl font-bold">
        <CalendarIcon aria-hidden="true" className="size-5 shrink-0" />
        <span>
          {when} · {formatTimePtBR(liturgy.time)}
        </span>
      </p>
      {liturgy.sermonDescription || liturgy.sermonSpeaker ? (
        <p className="text-muted-foreground mt-3 max-w-prose">
          {liturgy.sermonDescription}
          {liturgy.sermonDescription && liturgy.sermonSpeaker ? ' ' : null}
          {liturgy.sermonSpeaker ? <em>– {liturgy.sermonSpeaker}</em> : null}
        </p>
      ) : null}
      {lastHeld ? (
        <p className="text-muted-foreground mt-3 max-w-prose">
          A ordem do próximo culto ainda não foi publicada. A programação da semana está na Agenda, mais abaixo.
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
        <Link
          href={`/liturgies/${liturgySlug(liturgy.date, liturgy.theme, liturgy.time)}`}
          className={cn(buttonVariants({ size: 'lg' }), 'h-12 px-6 text-base')}
        >
          Ver a ordem do culto
        </Link>
        <VisitLink />
      </div>
    </>
  )
}

function NoService() {
  return (
    <>
      <p className="eyebrow text-brand-ridge">Próximo culto</p>
      <h1 className="text-display text-brand-ridge mt-4 font-serif">{CHURCH_NAME}</h1>
      <p className="text-brand-deep mt-5 text-xl font-bold">A ordem do próximo culto será publicada em breve</p>
      <div className="mt-8">
        <VisitLink />
      </div>
    </>
  )
}

export default async function Home({ searchParams }: PageProps<'/'>) {
  const { page: rawPage } = await searchParams
  const todayDate = today()
  const currentTime = currentTimeHHMM()
  const weekWindow = currentWeekWindow(todayDate)
  const [latest, total, agendaItems, announcements, recentBulletins, dominicalBulletin, nextLiturgy] =
    await Promise.all([
      getLatestArticle(),
      countArticles(),
      listAgendaInWindow(weekWindow.from, weekWindow.to),
      listActiveAnnouncements(todayDate),
      listRecentBulletins({ today: todayDate, limit: 5 }),
      getLatestDominicalBulletin(todayDate),
      getNextLiturgy({ today: todayDate, currentTime }),
    ])
  const pages = totalPages(total, PAGE_SIZE)
  const page = resolvePage(rawPage, pages)
  const articles = await listArticles({ page, pageSize: PAGE_SIZE })
  const agendaDays = groupAgendaByWeekday(agendaItems)

  return (
    <main>
      <section className="bg-brand-sky">
        <div className="container mx-auto px-5 md:px-8">
          <div className="grid items-center gap-6 py-14 md:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] md:gap-10 md:py-20">
            <div>{nextLiturgy ? <NextService next={nextLiturgy} /> : <NoService />}</div>
            <HeroScene className="order-first h-40 w-full sm:h-56 md:order-none md:h-72" />
          </div>
        </div>
      </section>

      {latest || dominicalBulletin ? (
        <section className="container mx-auto px-5 pt-6 pb-16 md:px-8">
          <div className="grid gap-10 md:grid-cols-5 md:gap-8">
            {latest ? (
              <article className="md:col-span-3">
                <SectionHead>Artigo recente</SectionHead>
                <Link href={`/articles/${latest.slug}`} className="group block">
                  <ArticleVisual
                    featuredImagePath={latest.featuredImagePath}
                    slug={latest.slug}
                    alt=""
                    className="h-56 w-full object-cover md:h-64"
                  />
                  <h3 className="text-editorial text-brand-ridge mt-5 font-serif group-hover:underline">
                    {latest.title}
                  </h3>
                </Link>
                <p className="text-muted-foreground mt-3 text-sm">
                  {publicAuthorName(latest)} · {formatLongDatePtBR(latest.date)}
                </p>
                {latest.excerpt ? <p className="mt-4 max-w-prose">{latest.excerpt}</p> : null}
              </article>
            ) : null}

            {dominicalBulletin ? (
              <article className="md:col-span-2">
                <SectionHead>Boletim dominical</SectionHead>
                <Link href={`/bulletins/${formatISODate(dominicalBulletin.date)}`} className="group block">
                  <PublicationTile kind="bulletin" className="h-40 w-full" />
                  <h3 className="font-narrow text-brand-deep mt-5 text-3xl leading-tight group-hover:underline">
                    {formatLongDatePtBR(dominicalBulletin.date)}
                  </h3>
                </Link>
                <p className="text-muted-foreground mt-3 text-sm">
                  {formatBulletinSubtitle(dominicalBulletin.edition, dominicalBulletin.date)}
                </p>
              </article>
            ) : null}
          </div>
        </section>
      ) : null}

      {agendaDays.length > 0 || announcements.length > 0 ? (
        <section className="container mx-auto px-5 pb-16 md:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            {agendaDays.length > 0 ? (
              <div>
                <SectionHead>Agenda da semana</SectionHead>
                <p className="text-muted-foreground -mt-4 mb-6">
                  {formatShortDatePtBR(weekWindow.from)} a {formatShortDatePtBR(weekWindow.to)}
                </p>
                <ol className="bg-brand-sky space-y-6 p-6">
                  {agendaDays.map((day) => (
                    <li key={day.weekday}>
                      <h3 className="eyebrow text-brand-ridge border-brand-accent mb-3 border-b pb-2">{day.label}</h3>
                      <dl className="space-y-2">
                        {day.items.map((item) => (
                          <div key={`${item.time ?? ''}-${item.title}`} className="flex gap-3">
                            <dt className="font-narrow text-brand-deep w-16 shrink-0 tabular-nums">
                              {item.time ? <time>{formatTimePtBR(item.time)}</time> : '—'}
                            </dt>
                            <dd>
                              <span className="block">{item.title}</span>
                              {item.description ? (
                                <span className="text-muted-foreground block text-sm">{item.description}</span>
                              ) : null}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {announcements.length > 0 ? (
              <div>
                <SectionHead>Avisos</SectionHead>
                <ul className="space-y-8">
                  {announcements.map((ann) => (
                    <li key={ann.id} className="border-brand-accent border-l-2 pl-5">
                      <h3 className="text-brand-ridge font-serif text-2xl leading-snug">{ann.title}</h3>
                      {ann.description ? (
                        <div className="prose prose-sm mt-2 max-w-none">
                          <Markdown content={ann.description} />
                        </div>
                      ) : null}
                      {ann.url ? (
                        <Link
                          href={ann.url}
                          className="text-brand-current mt-2 inline-block underline-offset-4 hover:underline"
                        >
                          Acesse
                        </Link>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {recentBulletins.length > 0 ? (
        <section className="container mx-auto px-5 pb-16 md:px-8">
          <SectionHead>Boletins publicados</SectionHead>
          <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentBulletins.map((b) => (
              <li key={b.id} className="border-border border-b pb-3">
                <Link href={`/bulletins/${formatISODate(b.date)}`} className="group block">
                  <h3 className="font-narrow text-brand-deep text-xl group-hover:underline">
                    {formatLongDatePtBR(b.date)}
                  </h3>
                  <p className="text-muted-foreground mt-1 text-sm">{formatBulletinSubtitle(b.edition, b.date)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="container mx-auto px-5 pb-20 md:px-8">
        <SectionHead>Artigos</SectionHead>
        <ArticleGrid articles={articles} page={page} totalPages={pages} basePath="/" />
      </section>
    </main>
  )
}
