import { ChevronRightIcon } from 'lucide-react'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import KeepOneLiturgyActOpen from '@/components/public/KeepOneLiturgyActOpen'
import OpenDetailsOnPrint from '@/components/public/OpenDetailsOnPrint'
import PageHeader from '@/components/public/PageHeader'
import { getLiturgyBySlug, type LiturgyDetail } from '@/db/queries/liturgies'
import { formatLongDatePtBR, formatTimePtBR } from '@/lib/date'
import { liturgyMetadata } from '@/lib/og/metadata'

const loadLiturgy = cache((slug: string) => getLiturgyBySlug(slug, 'published-only'))

export async function generateMetadata({ params }: PageProps<'/liturgies/[slug]'>) {
  const { slug } = await params
  const liturgy = await loadLiturgy(slug)
  if (!liturgy) return {}
  return liturgyMetadata({
    slug,
    theme: liturgy.theme,
    time: liturgy.time,
    date: liturgy.date,
    description: liturgy.description,
  })
}

export default async function LiturgyDetailPage({ params }: PageProps<'/liturgies/[slug]'>) {
  const { slug } = await params
  const liturgy = await loadLiturgy(slug)
  if (!liturgy) notFound()

  return (
    <main>
      <OpenDetailsOnPrint />
      <PageHeader
        eyebrow="Liturgia"
        title={liturgy.theme}
        meta={`${formatLongDatePtBR(liturgy.date)} às ${formatTimePtBR(liturgy.time)}`}
      />

      <div className="container mx-auto px-5 pt-6 pb-20 md:px-8 print:px-0 print:pt-7 print:pb-0">
        <KeepOneLiturgyActOpen listId="liturgy-acts" />
        <ol id="liturgy-acts" className="max-w-3xl space-y-10 print:max-w-none print:space-y-7">
          {liturgy.acts.map((act, i) => (
            <li key={act.id}>
              <details open={i === 0} className="group">
                <summary className="border-brand-accent flex cursor-pointer list-none items-baseline gap-4 border-b-2 pb-2 group-open:cursor-default print:break-after-avoid">
                  <span aria-hidden="true" className="font-narrow text-brand-deep text-sm tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h2 className="eyebrow text-brand-ridge flex-1">{act.name}</h2>
                  <ChevronRightIcon
                    aria-hidden="true"
                    className="text-brand-accent size-4 transition-transform group-open:rotate-90 print:hidden"
                  />
                </summary>
                <ul className="mt-6 space-y-7">
                  {act.moments.map((moment) => (
                    <li key={moment.id} className="print:break-inside-avoid">
                      <MomentView moment={moment} />
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ol>
      </div>
    </main>
  )
}

type Moment = LiturgyDetail['acts'][0]['moments'][0]

function MomentLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="font-narrow text-brand-ridge text-xl font-bold">{children}</h3>
}

function PassagesView({ passages }: { passages: NonNullable<Moment['scripture_passages']> }) {
  return (
    <>
      {passages.map((passage, i) => (
        <div key={i} className="mt-2">
          <MomentLabel>
            {passage.reference}{' '}
            <small className="text-muted-foreground font-sans text-sm font-normal italic">({passage.version})</small>
          </MomentLabel>
          <p className="mt-2 font-serif whitespace-pre-line">{passage.text}</p>
        </div>
      ))}
    </>
  )
}

function MomentView({ moment }: { moment: Moment }) {
  if (moment.type === 'bible_reading' && moment.scripture_passages) {
    return (
      <>
        <p className="eyebrow text-brand-ridge">Leitura bíblica</p>
        <PassagesView passages={moment.scripture_passages} />
        {moment.description ? <p className="text-muted-foreground mt-2 text-sm">{moment.description}</p> : null}
      </>
    )
  }

  if (moment.type === 'song') {
    return (
      <>
        <MomentLabel>
          {moment.song?.title ?? moment.description}
          {moment.song?.songReference ? (
            <small className="text-muted-foreground block font-sans text-sm font-normal normal-case italic">
              {moment.song.songReference}
            </small>
          ) : null}
        </MomentLabel>
        {moment.song?.lyrics ? (
          <div className="mt-3 space-y-3 font-serif">
            {moment.song.lyrics.map((block, i) => {
              if (block.type === 'verse')
                return (
                  <p key={i} className="whitespace-pre-line">
                    {block.number ? <strong>{block.number}. </strong> : null}
                    {block.content}
                  </p>
                )
              if (block.type === 'chorus')
                return (
                  <p key={i} className="border-brand-accent border-l-2 pl-4 whitespace-pre-line italic">
                    {block.content}
                  </p>
                )
            })}
          </div>
        ) : null}
      </>
    )
  }

  if (moment.type === 'sermon') {
    return (
      <>
        {moment.scripture_passages ? <PassagesView passages={moment.scripture_passages} /> : null}
        {moment.description ? (
          <p className="text-brand-ridge mt-2 font-serif text-2xl leading-snug">
            {moment.description}
            {moment.sermon_speaker ? (
              <cite className="text-muted-foreground mt-1 block font-sans text-sm font-normal not-italic">
                {moment.sermon_speaker}
              </cite>
            ) : null}
          </p>
        ) : moment.sermon_speaker ? (
          <p className="text-muted-foreground">{moment.sermon_speaker}</p>
        ) : null}
      </>
    )
  }

  if (moment.type === 'sacrament') {
    const label = moment.sacrament_type === 'baptism' ? 'Batismo' : 'Santa Ceia'
    return (
      <>
        <MomentLabel>{label}</MomentLabel>
        {moment.description ? <p className="mt-2 whitespace-pre-line">{moment.description}</p> : null}
      </>
    )
  }

  return <MomentLabel>{moment.description}</MomentLabel>
}
