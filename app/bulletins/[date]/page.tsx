import Link from 'next/link'
import { notFound } from 'next/navigation'
import { listActiveAnnouncements, listAgendaInWindow, listBirthdaysInWindow } from '@/db/queries/bulletin-sections'
import { getBulletinByDate } from '@/db/queries/bulletins'
import { formatBulletinSubtitle, liturgySlug } from '@/lib/bulletin'
import { formatLongDatePtBR } from '@/lib/date'

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

      {bulletin.show_agenda && agendaItems.length > 0 ? (
        <section className="mb-10">
          <h2 className="font-narrow mb-3 text-2xl text-green-900">Agenda</h2>
          <ul className="space-y-1">
            {agendaItems.map((item) => (
              <li key={item.id}>
                <span className="font-medium">{formatLongDatePtBR(item.resolvedDate)}</span>
                {item.time ? ` às ${item.time}` : ''} — {item.title}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {bulletin.show_announcements && announcements.length > 0 ? (
        <section className="mb-10">
          <h2 className="font-narrow mb-3 text-2xl text-green-900">Anúncios</h2>
          <ul className="space-y-3">
            {announcements.map((ann) => (
              <li key={ann.id}>
                <p className="font-medium">{ann.title}</p>
                {ann.description ? <p className="text-gray-600">{ann.description}</p> : null}
                {ann.url ? (
                  <Link href={ann.url} className="text-green-900 underline text-sm">
                    {ann.url}
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {bulletin.show_birthdays && birthdays.length > 0 ? (
        <section className="mb-10">
          <h2 className="font-narrow mb-3 text-2xl text-green-900">Aniversariantes</h2>
          <ul className="space-y-1">
            {birthdays.map((m) => (
              <li key={m.id}>
                {m.birth_date!.slice(8, 10)}/{m.birth_date!.slice(5, 7)} — {m.full_name}
              </li>
            ))}
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
