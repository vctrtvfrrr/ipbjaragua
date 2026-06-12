import { notFound } from 'next/navigation'
import { getLiturgyBySlug, type LiturgyDetail } from '@/db/queries/liturgies'
import { todayISO, formatLongDatePtBR } from '@/lib/date'

export default async function LiturgyDetailPage({ params }: PageProps<'/liturgies/[slug]'>) {
  const { slug } = await params
  const liturgy = await getLiturgyBySlug(slug, todayISO())
  if (!liturgy) notFound()

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 xl:px-0">
      <h2 className="font-narrow text-center text-5xl text-green-900">{liturgy.theme}</h2>
      <p className="mt-2 text-center text-gray-500">
        {formatLongDatePtBR(liturgy.date)}
        {liturgy.time ? ` — ${liturgy.time}` : null}
      </p>

      <div className="mt-10 space-y-6">
        {liturgy.acts.map((act, i) => (
          <details key={act.id} open={i === 0}>
            <summary className="font-narrow mb-2 cursor-pointer text-2xl font-bold uppercase">
              {act.name}
            </summary>
            <ul className="mt-2 space-y-4">
              {act.moments.map((moment) => (
                <li key={moment.id}>
                  <MomentView moment={moment} />
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </main>
  )
}

type Moment = LiturgyDetail['acts'][0]['moments'][0]

function MomentView({ moment }: { moment: Moment }) {
  if (moment.type === 'bible_reading') {
    const passage = moment.scripture_passages
      ? (JSON.parse(moment.scripture_passages) as { reference: string; text: string; version: string })
      : null
    return (
      <>
        {passage ? (
          <>
            <h4 className="font-narrow text-xl font-bold text-green-900 uppercase">
              {passage.reference}{' '}
              <small className="font-sans text-sm font-normal text-gray-500 italic">({passage.version})</small>
            </h4>
            <p className="mt-1 whitespace-pre-line text-sm">{passage.text}</p>
          </>
        ) : (
          <p className="text-gray-400">{moment.description ?? 'Leitura bíblica'}</p>
        )}
      </>
    )
  }

  if (moment.type === 'song') {
    return (
      <>
        <h4 className="font-narrow text-xl font-bold text-green-900 uppercase">
          {moment.song?.title ?? moment.description}
          {moment.song?.songReference ? (
            <small className="block font-sans font-normal normal-case italic">{moment.song.songReference}</small>
          ) : null}
        </h4>
      </>
    )
  }

  if (moment.type === 'sermon') {
    return (
      <>
        {moment.description ? (
          <p className="font-narrow text-center text-lg font-bold text-green-900">
            {moment.description}
            {moment.sermon_speaker ? (
              <cite className="block font-sans text-sm font-normal text-gray-500">— {moment.sermon_speaker}</cite>
            ) : null}
          </p>
        ) : moment.sermon_speaker ? (
          <p className="text-gray-500">{moment.sermon_speaker}</p>
        ) : null}
      </>
    )
  }

  if (moment.type === 'sacrament') {
    const label = moment.sacrament_type === 'baptism' ? 'Batismo' : 'Santa Ceia'
    return <p className="font-narrow text-xl font-bold">{label}</p>
  }

  // prayer, other, pastoral_act
  return <p>{moment.description}</p>
}
