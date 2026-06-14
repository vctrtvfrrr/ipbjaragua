import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import BulletinArticle from '@/components/BulletinArticle'
import { listActiveAnnouncements, listAgendaInWindow, listAnniversariesInWindow } from '@/db/queries/bulletin-sections'
import { getBulletinByDate } from '@/db/queries/bulletins'
import { listLiturgiesByDate } from '@/db/queries/liturgies'
import { formatBulletinSubtitle, groupAgendaByWeekday, liturgySlug } from '@/lib/bulletin'
import { formatLongDatePtBR, formatShortDatePtBR, todayISO } from '@/lib/date'

export async function generateMetadata({ params }: PageProps<'/bulletins/[date]'>) {
  const { date } = await params
  const result = await getBulletinByDate(date, todayISO())
  return { title: result?.bulletin.title ?? formatLongDatePtBR(date) }
}

const sectionCard = 'mb-8 break-inside-avoid rounded border border-gray-200 bg-gray-50 p-5'

export default async function BulletinDetailPage({ params }: PageProps<'/bulletins/[date]'>) {
  const { date } = await params
  const result = await getBulletinByDate(date, todayISO())

  if (!result) notFound()

  const { bulletin, article } = result

  const [agendaItems, announcements, anniversaries, liturgiesOfDay] = await Promise.all([
    bulletin.show_agenda ? listAgendaInWindow(bulletin.agenda_from, bulletin.agenda_to) : Promise.resolve([]),
    bulletin.show_announcements ? listActiveAnnouncements(bulletin.date) : Promise.resolve([]),
    bulletin.show_birthdays
      ? listAnniversariesInWindow(bulletin.birthdays_from, bulletin.birthdays_to)
      : Promise.resolve([]),
    listLiturgiesByDate(bulletin.date),
  ])

  const agendaDays = groupAgendaByWeekday(agendaItems)

  return (
    <main className="container mx-auto px-4 py-10 xl:px-0">
      <header className="mb-10">
        <h1 className="font-narrow mb-1 text-4xl text-green-900">
          {bulletin.title ?? formatLongDatePtBR(bulletin.date)}
        </h1>
        <p className="text-gray-500">{formatLongDatePtBR(bulletin.date)}</p>
        <p className="text-gray-500">{formatBulletinSubtitle(bulletin.edition, bulletin.date)}</p>
      </header>

      {article ? <BulletinArticle article={article} /> : null}

      <div className="mb-10 lg:columns-3 lg:gap-8">
        {bulletin.show_agenda && agendaDays.length > 0 ? (
          <section className={sectionCard}>
            <h2 className="font-narrow mb-1 text-2xl text-green-900 uppercase">Agenda da Semana</h2>
            <p className="mb-5 text-gray-500">
              {formatShortDatePtBR(bulletin.agenda_from)} a {formatShortDatePtBR(bulletin.agenda_to)}
            </p>
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
          </section>
        ) : null}

        {bulletin.show_announcements && announcements.length > 0 ? (
          <section className={sectionCard}>
            <h2 className="font-narrow mb-5 text-2xl text-green-900 uppercase">Avisos Gerais</h2>
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
          </section>
        ) : null}

        {bulletin.show_birthdays && anniversaries.length > 0 ? (
          <section className={sectionCard}>
            <h2 className="font-narrow mb-5 text-2xl text-green-900 uppercase">Aniversariantes</h2>
            <div className="space-y-4">
              {anniversaries.map((day) => (
                <div key={day.md}>
                  <h3 className="font-narrow text-lg font-bold">
                    <span className="text-red-500">‣</span> {day.md} — {day.weekday}
                  </h3>
                  <ul className="ml-4 space-y-1">
                    {day.names.map((name, i) => (
                      <li key={i}>
                        {name.split('♥').flatMap((part, j, arr) =>
                          j < arr.length - 1
                            ? [
                                part,
                                <span key={j} className="text-red-500">
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
            <h2 className="font-narrow mb-5 text-2xl text-green-900 uppercase">Liturgia</h2>
            {liturgiesOfDay.length === 1 ? (
              <Link
                href={`/liturgies/${liturgySlug(liturgiesOfDay[0].date, liturgiesOfDay[0].theme, liturgiesOfDay[0].time)}`}
                className="text-green-900 underline"
              >
                {liturgiesOfDay[0].theme}
              </Link>
            ) : (
              <ul className="space-y-1">
                {liturgiesOfDay.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/liturgies/${liturgySlug(l.date, l.theme, l.time)}`}
                      className="text-green-900 underline"
                    >
                      {l.theme}
                      {l.time ? ` — ${l.time}` : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </div>
    </main>
  )
}
