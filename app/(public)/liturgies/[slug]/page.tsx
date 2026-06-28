import { notFound } from 'next/navigation'
import { getLiturgyBySlug, type LiturgyDetail } from '@/db/queries/liturgies'
import { formatLongDatePtBR, today } from '@/lib/date'
import { parseLyrics } from '@/lib/song'

export default async function LiturgyDetailPage({ params }: PageProps<'/liturgies/[slug]'>) {
  const { slug } = await params
  const liturgy = await getLiturgyBySlug(slug, today())
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
            <summary
              data-marker="⁜ "
              className="marker:text-2xl marker:font-bold marker:text-red-500 marker:content-[attr(data-marker)]"
            >
              <h3 className="font-narrow mb-2 inline cursor-pointer text-2xl font-bold uppercase">{act.name}</h3>
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
type ScripturePassage = { reference: string; text: string; version: string }

function parsePassages(raw: string): ScripturePassage[] {
  return JSON.parse(raw) as ScripturePassage[]
}

function PassagesView({ raw }: { raw: string }) {
  return (
    <>
      {parsePassages(raw).map((passage, i) => (
        <div key={i}>
          <h4 className="font-narrow text-xl font-bold text-green-900 uppercase">
            {passage.reference}{' '}
            <small className="font-sans text-sm font-normal text-gray-500 italic">({passage.version})</small>
          </h4>
          <p className="mt-1 whitespace-pre-line">{passage.text}</p>
        </div>
      ))}
    </>
  )
}

function MomentView({ moment }: { moment: Moment }) {
  if (moment.type === 'bible_reading' && moment.scripture_passages) {
    return (
      <>
        <strong className="font-narrow mb-2 text-xl">
          <span className="text-red-500">‣</span> Leitura Bíblica:
        </strong>
        <PassagesView raw={moment.scripture_passages} />
        {moment.description ? <p className="text-gray-400">{moment.description}</p> : null}
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
        {moment.song?.lyrics ? (
          <div className="mt-2 space-y-2">
            {parseLyrics(moment.song.lyrics).map((block, i) => {
              if (block.type === 'verse')
                return (
                  <p key={i}>
                    {block.number ? <strong>{block.number}. </strong> : null}
                    {block.content}
                  </p>
                )
              if (block.type === 'chorus')
                return (
                  <p key={i} className="pl-4 italic">
                    {block.content}
                  </p>
                )
              return <p key={i}>{block.content}</p>
            })}
          </div>
        ) : null}
      </>
    )
  }

  if (moment.type === 'sermon') {
    return (
      <>
        {moment.scripture_passages ? <PassagesView raw={moment.scripture_passages} /> : null}
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

  return (
    <strong className="font-narrow text-xl">
      <span className="text-red-500">‣</span> {moment.description}
    </strong>
  )
}
