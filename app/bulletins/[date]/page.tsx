import Link from 'next/link'
import { notFound } from 'next/navigation'
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
