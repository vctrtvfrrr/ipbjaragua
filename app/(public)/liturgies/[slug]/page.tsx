import { ChevronRightIcon } from 'lucide-react'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import KeepOneLiturgyActOpen from '@/components/public/KeepOneLiturgyActOpen'
import OpenDetailsOnPrint from '@/components/public/OpenDetailsOnPrint'
import PageHeader from '@/components/public/PageHeader'
import { getLiturgyBySlug, type LiturgyDetail } from '@/db/queries/liturgies'
import { getCurrentUser } from '@/lib/auth/current-user'
import { formatLongDatePtBR } from '@/lib/date'
import { liturgySermonSummary } from '@/lib/liturgy'
import { liturgyVisibilityForUser } from '@/lib/liturgy-visibility'
import { liturgyMetadata } from '@/lib/og/metadata'

const loadLiturgy = cache(async (slug: string) => {
  const user = await getCurrentUser()
  return getLiturgyBySlug(slug, liturgyVisibilityForUser(user))
})

export async function generateMetadata({ params }: PageProps<'/liturgies/[slug]'>) {
  const { slug } = await params
  const liturgy = await loadLiturgy(slug)
  if (!liturgy) return {}
  return liturgyMetadata(
    {
      slug,
      theme: liturgy.theme,
      time: liturgy.time,
      date: liturgy.date,
      description: liturgy.description,
    },
    { draft: liturgy.status === 'draft' }
  )
}

export default async function LiturgyDetailPage({ params }: PageProps<'/liturgies/[slug]'>) {
  const { slug } = await params
  const liturgy = await loadLiturgy(slug)
  if (!liturgy) notFound()

  return (
    <main>
      <OpenDetailsOnPrint />
      {liturgy.status === 'draft' ? (
        <p className="bg-brand-current font-narrow print:border-brand-ridge print:text-brand-ridge py-2 text-center text-sm font-bold tracking-[0.06em] text-white uppercase print:border-b-2 print:bg-transparent print:py-1">
          Rascunho — esta Liturgia não aparece para o público
        </p>
      ) : null}
      <PageHeader
        eyebrow="Liturgia"
        title={liturgy.theme}
        meta={`${formatLongDatePtBR(liturgy.date)} às ${liturgy.time}`}
      />

      <div className="container mx-auto px-5 pt-6 pb-20 md:px-8 print:px-0 print:pt-7 print:pb-0">
        <KeepOneLiturgyActOpen listId="liturgy-acts" />
        <ol id="liturgy-acts" className="space-y-10 print:space-y-7">
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
                    <li key={moment.id}>
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
  return <h3 className="font-narrow text-brand-ridge text-xl font-bold print:break-after-avoid">{children}</h3>
}

function PassagesCard({
  passages,
  description,
}: {
  passages: NonNullable<Moment['scripture_passages']>
  description?: string | null
}) {
  return (
    <div className="mt-2 space-y-4 rounded-xl bg-neutral-100 p-6 print:bg-transparent print:px-0">
      {passages.map((passage, i) => (
        <div key={i}>
          <MomentLabel>
            {passage.reference}{' '}
            <small className="text-muted-foreground font-sans text-sm font-normal italic">({passage.version})</small>
          </MomentLabel>
          <p className="mt-2 font-serif whitespace-pre-line">{passage.text}</p>
        </div>
      ))}
      {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
    </div>
  )
}

function MomentView({ moment }: { moment: Moment }) {
  if (moment.type === 'bible_reading' && moment.scripture_passages) {
    return (
      <>
        <p className="eyebrow text-brand-ridge print:break-after-avoid">Leitura bíblica</p>
        <PassagesCard passages={moment.scripture_passages} description={moment.description} />
      </>
    )
  }

  if (moment.type === 'song') {
    return (
      <>
        <p className="eyebrow text-brand-ridge print:break-after-avoid">Cântico</p>
        <div className="bg-brand-sky mt-2 rounded-xl p-6 print:bg-transparent print:px-0">
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
                    <p key={i} className="whitespace-pre-line print:break-inside-avoid">
                      {block.number ? <strong>{block.number}. </strong> : null}
                      {block.content}
                    </p>
                  )
                if (block.type === 'chorus')
                  return (
                    <p
                      key={i}
                      className="border-brand-accent border-l-2 pl-4 whitespace-pre-line italic print:break-inside-avoid"
                    >
                      {block.content}
                    </p>
                  )
              })}
            </div>
          ) : null}
        </div>
      </>
    )
  }

  if (moment.type === 'sermon') {
    const sermon = liturgySermonSummary(moment.description, moment.sermon_speaker)
    return (
      <>
        {sermon?.speaker ? (
          <p className="text-brand-ridge font-serif text-2xl leading-snug">
            {sermon.theme}
            <cite className="text-muted-foreground mt-1 block font-sans text-sm font-normal not-italic">
              {sermon.speakerText}
            </cite>
          </p>
        ) : null}
        {moment.scripture_passages ? <PassagesCard passages={moment.scripture_passages} /> : null}
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
