import { CHURCH_BODY, CHURCH_DOOR, CHURCH_SPIRE, CHURCH_WINDOW, HILL_FAR, HILL_NEAR } from '@/components/brand/symbol'

const SKY = 'var(--brand-sky)'
const RIDGE = 'var(--brand-ridge)'
const ACCENT = 'var(--brand-accent)'

export type PublicationKind = 'article' | 'liturgy'

const CROPS: Record<PublicationKind, string> = {
  article: '0 140 430 210',
  liturgy: '80 18 270 200',
}

const ARTICLE_CROPS = [
  '80 130 300 170',
  '140 170 290 165',
  '190 140 240 135',
  '0 150 300 170',
  '220 165 210 118',
  '100 145 260 147',
]

function articleCrop(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 100003
  return ARTICLE_CROPS[hash % ARTICLE_CROPS.length]
}

type Props = { kind: PublicationKind; seed?: string; className?: string }

export default function PublicationTile({ kind, seed, className }: Props) {
  const viewBox = kind === 'article' && seed ? articleCrop(seed) : CROPS[kind]

  return (
    <svg
      aria-hidden="true"
      role="presentation"
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid slice"
      className={className}
    >
      <rect x="0" y="0" width="430" height="410" fill={SKY} />
      <path d={HILL_FAR} fill={ACCENT} />
      <path d={HILL_NEAR} fill={RIDGE} />
      {kind === 'liturgy' ? (
        <>
          <path d={CHURCH_BODY} fill="#ffffff" stroke={RIDGE} strokeWidth="2" />
          <polygon points={CHURCH_SPIRE} fill={RIDGE} />
          <path d={CHURCH_DOOR} fill={RIDGE} />
          <path d={CHURCH_WINDOW} fill={RIDGE} />
        </>
      ) : null}
    </svg>
  )
}
