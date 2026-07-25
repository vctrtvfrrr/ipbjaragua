import Link from 'next/link'
import ArticleGrid from '@/components/ArticleGrid'
import Horizon from '@/components/brand/Horizon'
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

function NextService({ next }: { next: NextLiturgyResult }) {
  const { liturgy, kind } = next
  const upcoming = kind === 'upcoming'
  const when = [formatWeekdayPtBR(liturgy.date), formatLongDatePtBR(liturgy.date)].join(', ')

  return (
    <>
      <p className="eyebrow text-brand-ridge">{upcoming ? 'Próximo culto' : 'Último culto'}</p>
      <h1 className="text-display text-brand-ridge mt-6 font-serif">{liturgy.theme}</h1>
      <p className="font-narrow text-brand-deep mt-6 text-2xl tracking-[0.06em] uppercase sm:text-3xl">
        {when} às {formatTimePtBR(liturgy.time)}
      </p>
      {liturgy.sermonSpeaker ? <p className="text-muted-foreground mt-3">Pregação: {liturgy.sermonSpeaker}</p> : null}
      {upcoming ? null : (
        <p className="text-muted-foreground mt-4 max-w-prose">
          A ordem de um culto é publicada no dia em que ele acontece. A programação da semana está na Agenda, mais
          abaixo.
        </p>
      )}
      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href={`/liturgies/${liturgySlug(liturgy.date, liturgy.theme, liturgy.time)}`}
          className={cn(buttonVariants({ size: 'lg' }), 'h-12 px-6 text-base')}
        >
          Ver a ordem do culto
        </Link>
        {upcoming ? null : (
          <Link
            href="/location"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-12 px-6 text-base')}
          >
            Visite-nos
          </Link>
        )}
      </div>
    </>
  )
}

function NoService() {
  return (
    <>
      <p className="eyebrow text-brand-ridge">Próximo culto</p>
      <h1 className="text-display text-brand-ridge mt-6 font-serif">{CHURCH_NAME}</h1>
      <p className="font-narrow text-brand-deep mt-6 text-2xl tracking-[0.06em] uppercase">
        A ordem do próximo culto será publicada em breve
      </p>
      <Link href="/location" className={cn(buttonVariants({ size: 'lg' }), 'mt-10 h-12 px-6 text-base')}>
        Visite-nos
      </Link>
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
      getNextLiturgy({ today: todayDate, currentTime, visibility: 'published-only' }),
    ])
  const pages = totalPages(total, PAGE_SIZE)
  const page = resolvePage(rawPage, pages)
  const articles = await listArticles({ page, pageSize: PAGE_SIZE })
  const agendaDays = groupAgendaByWeekday(agendaItems)

  return (
    <main>
      <section className="bg-brand-sky">
        <div className="container mx-auto px-5 md:px-8">
          <div className="max-w-3xl py-20 md:py-32 lg:pr-24">
            {nextLiturgy ? <NextService next={nextLiturgy} /> : <NoService />}
          </div>
        </div>
      </section>
      <Horizon className="block h-16 w-full md:h-28" />

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
