import { CalendarIcon, FileTextIcon, NewspaperIcon } from 'lucide-react'
import Link from 'next/link'
import ArticleGrid from '@/components/ArticleGrid'
import HeroScene from '@/components/brand/HeroScene'
import Markdown from '@/components/Markdown'
import ArrowLink from '@/components/public/ArrowLink'
import ArticleVisual from '@/components/public/ArticleVisual'
import SectionHead from '@/components/public/SectionHead'
import { buttonVariants } from '@/components/ui/button'
import { countArticles, getLatestArticle, listArticles } from '@/db/queries/articles'
import { listActiveAnnouncements, listAgendaInWindow } from '@/db/queries/bulletin-sections'
import { getLatestDominicalBulletin, listRecentBulletins } from '@/db/queries/bulletins'
import { getNextLiturgy, type NextLiturgyResult } from '@/db/queries/liturgies'
import { resolveAnnouncementIcon } from '@/lib/announcement-icon'
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
        <ArrowLink href="/location">Planeje sua visita</ArrowLink>
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
        <ArrowLink href="/location">Planeje sua visita</ArrowLink>
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
        <section className="container mx-auto px-5 py-12 md:px-8">
          <div className="grid gap-6 md:grid-cols-5">
            {latest ? (
              <article className="bg-brand-sky flex items-end overflow-hidden rounded-xl md:col-span-3">
                <div className="flex-1 p-6 md:p-8">
                  <p className="text-muted-foreground flex items-center gap-3 text-sm">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white">
                      <NewspaperIcon aria-hidden="true" className="text-brand-ridge size-5" />
                    </span>
                    Artigo em destaque
                  </p>
                  <h2 className="text-brand-ridge mt-4 font-serif text-3xl leading-tight">
                    <Link href={`/articles/${latest.slug}`} className="underline-offset-4 hover:underline">
                      {latest.title}
                    </Link>
                  </h2>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {publicAuthorName(latest)} · {formatLongDatePtBR(latest.date)}
                  </p>
                  <ArrowLink href={`/articles/${latest.slug}`} className="text-brand-ridge mt-2">
                    Ler artigo
                  </ArrowLink>
                </div>
                <ArticleVisual
                  featuredImagePath={latest.featuredImagePath}
                  slug={latest.slug}
                  alt=""
                  className="hidden aspect-video w-1/2 shrink-0 object-cover sm:block"
                />
              </article>
            ) : null}

            {dominicalBulletin ? (
              <article className="border-border flex gap-4 self-start rounded-xl border p-6 md:col-span-2 md:p-8">
                <span className="bg-brand-sky flex size-10 shrink-0 items-center justify-center rounded-lg">
                  <FileTextIcon aria-hidden="true" className="text-brand-deep size-5" />
                </span>
                <div>
                  <h2 className="text-brand-deep text-xl font-bold">
                    <Link
                      href={`/bulletins/${formatISODate(dominicalBulletin.date)}`}
                      className="underline-offset-4 hover:underline"
                    >
                      Boletim Dominical
                    </Link>
                  </h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {formatBulletinSubtitle(dominicalBulletin.edition, dominicalBulletin.date)} ·{' '}
                    {formatLongDatePtBR(dominicalBulletin.date)}
                  </p>
                  <ArrowLink href={`/bulletins/${formatISODate(dominicalBulletin.date)}`} className="mt-1">
                    Ver boletim
                  </ArrowLink>
                </div>
              </article>
            ) : null}
          </div>
        </section>
      ) : null}

      {agendaDays.length > 0 || announcements.length > 0 ? (
        <section className="container mx-auto px-5 pb-12 md:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {agendaDays.length > 0 ? (
              <div className="border-border rounded-xl border p-6 md:p-8">
                <h2 className="text-brand-deep font-serif text-2xl">Agenda da semana</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {formatShortDatePtBR(weekWindow.from)} a {formatShortDatePtBR(weekWindow.to)}
                </p>
                <ol className="divide-border mt-6 divide-y">
                  {agendaDays.map((day) => (
                    <li key={day.weekday} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      <span
                        aria-hidden="true"
                        className="bg-brand-sky flex size-11 shrink-0 items-center justify-center rounded-lg"
                      >
                        <CalendarIcon className="text-brand-deep size-5" />
                      </span>
                      <div className="w-16 shrink-0">
                        <h3 className="eyebrow text-brand-deep">{day.label.slice(0, 3)}</h3>
                        <p className="text-muted-foreground mt-1.5 text-sm tabular-nums">
                          {formatShortDatePtBR(day.items[0].resolvedDate)}
                        </p>
                      </div>
                      <ul className="min-w-0 flex-1 space-y-3">
                        {day.items.map((item) => (
                          <li key={`${item.time ?? ''}-${item.title}`}>
                            <span className="text-brand-deep block font-bold">{item.title}</span>
                            <span className="text-muted-foreground block text-sm">
                              {item.time ? <time>{formatTimePtBR(item.time)}</time> : null}
                              {item.time && item.description ? ' · ' : null}
                              {item.description}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {announcements.length > 0 ? (
              <div className="border-border rounded-xl border p-6 md:p-8">
                <h2 className="text-brand-deep font-serif text-2xl">Avisos</h2>
                <ul className="divide-border mt-6 divide-y">
                  {announcements.map((ann) => {
                    const Icon = resolveAnnouncementIcon(ann.icon)
                    return (
                      <li key={ann.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                        <span
                          aria-hidden="true"
                          className="bg-brand-accent/15 flex size-11 shrink-0 items-center justify-center rounded-full"
                        >
                          <Icon className="text-brand-ridge size-5" />
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-brand-deep font-bold">{ann.title}</h3>
                          {ann.description ? (
                            <div className="prose prose-sm mt-1 max-w-none">
                              <Markdown content={ann.description} />
                            </div>
                          ) : null}
                          {ann.url ? <ArrowLink href={ann.url}>Acesse</ArrowLink> : null}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {recentBulletins.length > 0 ? (
        <section className="container mx-auto px-5 pb-12 md:px-8">
          <div className="bg-brand-sky rounded-xl p-6 md:p-8">
            <h2 className="text-brand-deep font-serif text-2xl">Boletins recentes</h2>
            <ul className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              {recentBulletins.map((b) => (
                <li key={b.id} className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white"
                  >
                    <FileTextIcon className="text-brand-deep size-5" />
                  </span>
                  <div>
                    <h3 className="text-brand-deep font-bold">
                      <Link href={`/bulletins/${formatISODate(b.date)}`} className="underline-offset-4 hover:underline">
                        {formatLongDatePtBR(b.date)}
                      </Link>
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm">{formatBulletinSubtitle(b.edition, b.date)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <ArrowLink href="/bulletins" className="mt-4">
              Ver todos os boletins
            </ArrowLink>
          </div>
        </section>
      ) : null}

      <section className="container mx-auto px-5 pb-20 md:px-8">
        <SectionHead>Artigos</SectionHead>
        <ArticleGrid articles={articles} page={page} totalPages={pages} basePath="/" />
      </section>
    </main>
  )
}
