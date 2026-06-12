import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { listActiveAnnouncements, listAgendaInWindow, listBirthdaysInWindow } from '@/db/queries/bulletin-sections'
import { getBulletinByDate } from '@/db/queries/bulletins'
import { formatBulletinSubtitle, groupAgendaByWeekday, liturgySlug } from '@/lib/bulletin'
import { formatLongDatePtBR, formatShortDatePtBR } from '@/lib/date'

export async function generateMetadata({ params }: PageProps<'/bulletins/[date]'>) {
  const { date } = await params
  const result = await getBulletinByDate(date)
  return { title: result?.bulletin.title ?? formatLongDatePtBR(date) }
}

export default async function BulletinDetailPage({ params }: PageProps<'/bulletins/[date]'>) {
  const { date } = await params
  const result = await getBulletinByDate(date)

  if (!result) notFound()

  const { bulletin, article, liturgy } = result

  const [agendaItems, announcements, birthdays] = await Promise.all([
    bulletin.show_agenda ? listAgendaInWindow(bulletin.agenda_from, bulletin.agenda_to) : Promise.resolve([]),
    bulletin.show_announcements ? listActiveAnnouncements(bulletin.date) : Promise.resolve([]),
    bulletin.show_birthdays
      ? listBirthdaysInWindow(bulletin.birthdays_from, bulletin.birthdays_to)
      : Promise.resolve([]),
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

      {article ? (
        <section className="mb-10">
          <h2 className="font-narrow mb-2 text-2xl text-green-900">{article.title}</h2>
          {article.author ? <p className="mb-1 text-sm text-gray-500">{article.author}</p> : null}
          {article.excerpt ? <p className="mb-3 text-justify">{article.excerpt}</p> : null}
          <Link href={`/articles/${article.slug}`} className="text-green-900 underline">
            Leia mais
          </Link>
        </section>
      ) : null}

      {bulletin.show_agenda && agendaDays.length > 0 ? (
        <section className="mb-10">
          <h2 className="font-narrow mb-1 text-center text-3xl text-green-900 uppercase">Agenda da Semana</h2>
          <p className="mb-5 text-center text-gray-500">
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
        <section className="mb-10">
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
        </section>
      ) : null}

      {bulletin.show_birthdays && birthdays.length > 0 ? (
        <section className="mb-10">
          <h2 className="font-narrow mb-5 text-center text-3xl text-green-900 uppercase">Aniversariantes</h2>
          <ul className="space-y-1">
            {birthdays.map((m) =>
              m.birth_date ? (
                <li key={m.id}>
                  {m.birth_date.slice(8, 10)}/{m.birth_date.slice(5, 7)} — {m.full_name}
                </li>
              ) : null,
            )}
          </ul>
        </section>
      ) : null}

      {liturgy ? (
        <section className="mt-10">
          <Link href={`/liturgies/${liturgySlug(liturgy.date, liturgy.theme)}`} className="text-green-900 underline">
            {liturgy.theme}
          </Link>
        </section>
      ) : null}
    </main>
  )
}
