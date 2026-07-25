import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import BulletinArticle from '@/components/BulletinArticle'
import Markdown from '@/components/Markdown'
import DraftBadge from '@/components/public/DraftBadge'
import PageHeader from '@/components/public/PageHeader'
import SectionHead from '@/components/public/SectionHead'
import { listActiveAnnouncements, listAgendaInWindow, listAnniversariesInWindow } from '@/db/queries/bulletin-sections'
import { getBulletinByDate } from '@/db/queries/bulletins'
import { listLiturgiesByDate } from '@/db/queries/liturgies'
import { getCurrentUser } from '@/lib/auth/current-user'
import { formatBulletinSubtitle, groupAgendaByWeekday, liturgySlug } from '@/lib/bulletin'
import { liturgyVisibilityForUser } from '@/lib/liturgy-visibility'
import {
  bulletinSectionWindows,
  formatLongDatePtBR,
  formatShortDatePtBR,
  formatTimePtBR,
  parseISODate,
  today,
} from '@/lib/date'
import { bulletinMetadata } from '@/lib/og/metadata'

const loadBulletin = cache((date: string, preview: boolean) =>
  getBulletinByDate(parseISODate(date), today(), undefined, { preview })
)

export async function generateMetadata({ params, searchParams }: PageProps<'/bulletins/[date]'>) {
  const { date } = await params
  const { preview } = await searchParams
  const isPreview = preview === '1'
  const result = await loadBulletin(date, isPreview)
  if (!result) return {}
  return bulletinMetadata(
    { date: result.bulletin.date, slug: date, title: result.bulletin.title, edition: result.bulletin.edition },
    { preview: isPreview }
  )
}

const sectionCard = 'bg-brand-sky mb-8 break-inside-avoid p-6 print:bg-transparent print:px-0'

export default async function BulletinDetailPage({ params, searchParams }: PageProps<'/bulletins/[date]'>) {
  const { date } = await params
  const { preview } = await searchParams
  const isPreview = preview === '1'
  const result = await loadBulletin(date, isPreview)

  if (!result) notFound()

  const { bulletin, article } = result
  const windows = bulletinSectionWindows(bulletin.date)
  // The Preview never leaks a draft Liturgia through an anonymous URL, regardless of session.
  const liturgyVisibility = isPreview ? 'published-only' : liturgyVisibilityForUser(await getCurrentUser())

  const [agendaItems, announcements, anniversaries, liturgiesOfDay] = await Promise.all([
    bulletin.show_agenda ? listAgendaInWindow(windows.agenda.from, windows.agenda.to) : Promise.resolve([]),
    bulletin.show_announcements ? listActiveAnnouncements(bulletin.date) : Promise.resolve([]),
    bulletin.show_birthdays
      ? listAnniversariesInWindow(windows.birthdays.from, windows.birthdays.to)
      : Promise.resolve([]),
    listLiturgiesByDate(bulletin.date, liturgyVisibility),
  ])

  const agendaDays = groupAgendaByWeekday(agendaItems)

  return (
    <main>
      <PageHeader
        eyebrow="Boletim"
        title={formatLongDatePtBR(bulletin.date)}
        meta={formatBulletinSubtitle(bulletin.edition, bulletin.date)}
      />

      <div className="container mx-auto px-5 pt-6 pb-20 md:px-8 print:px-0 print:pt-7 print:pb-0">
        {article ? <BulletinArticle article={article} /> : null}

        <div className="mb-10 lg:columns-3 lg:gap-8 print:columns-1">
          {bulletin.show_agenda && agendaDays.length > 0 ? (
            <section className={sectionCard}>
              <SectionHead>Agenda da semana</SectionHead>
              <p className="text-muted-foreground -mt-4 mb-5 text-sm">
                {formatShortDatePtBR(windows.agenda.from)} a {formatShortDatePtBR(windows.agenda.to)}
              </p>
              <ol className="space-y-6">
                {agendaDays.map((day) => (
                  <li key={day.weekday}>
                    <h3 className="eyebrow text-brand-ridge border-brand-accent mb-2 border-b pb-1">{day.label}</h3>
                    <ul>
                      {day.items.map((item) => (
                        <li key={item.id}>
                          {item.time ? (
                            <>
                              <time className="font-narrow text-brand-deep">{formatTimePtBR(item.time)}</time> –{' '}
                            </>
                          ) : null}
                          {item.title}
                          {item.description ? (
                            <>
                              {' '}
                              – <em className="text-muted-foreground">{item.description}</em>
                            </>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {bulletin.show_announcements && announcements.length > 0 ? (
            <section className={sectionCard}>
              <SectionHead>Avisos gerais</SectionHead>
              <ul className="space-y-6">
                {announcements.map((ann) => (
                  <li key={ann.id}>
                    <h3 className="text-brand-ridge font-serif text-xl leading-snug">{ann.title}</h3>
                    {ann.description ? (
                      <div className="prose prose-sm mt-1 max-w-none">
                        <Markdown content={ann.description} />
                      </div>
                    ) : null}
                    {ann.url ? (
                      <Link href={ann.url} className="text-brand-current underline-offset-4 hover:underline">
                        Acesse
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {bulletin.show_birthdays && anniversaries.length > 0 ? (
            <section className={sectionCard}>
              <SectionHead>Aniversariantes</SectionHead>
              <div className="space-y-4">
                {anniversaries.map((day) => (
                  <div key={day.md}>
                    <h3 className="eyebrow text-brand-ridge mb-1">
                      {day.md} — {day.weekday}
                    </h3>
                    <ul className="ml-4 space-y-1">
                      {day.names.map((name, i) => (
                        <li key={i}>
                          {name.split('♥').flatMap((part, j, arr) =>
                            j < arr.length - 1
                              ? [
                                  part,
                                  <span key={j} className="text-brand-ridge">
                                    ♥
                                  </span>,
                                ]
                              : [part]
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {liturgiesOfDay.length > 0 ? (
            <section className={sectionCard}>
              <SectionHead>Liturgia</SectionHead>
              <ul className="space-y-1">
                {liturgiesOfDay.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/liturgies/${liturgySlug(l.date, l.theme, l.time)}`}
                      className="group block underline-offset-4"
                    >
                      <h3 className="font-narrow text-brand-deep text-xl group-hover:underline">
                        {l.theme}
                        {` · ${formatTimePtBR(l.time)}`}
                        {l.status === 'draft' ? <DraftBadge /> : null}
                      </h3>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  )
}
