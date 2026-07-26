import {
  CHURCH_BODY,
  CHURCH_DOOR,
  CHURCH_SPIRE,
  CHURCH_WINDOW,
  HILL_FAR,
  HILL_NEAR,
  WAVE_DEEP,
  WAVE_MID,
} from '@/components/brand/symbol'

const SKY = 'var(--brand-sky)'
const RIDGE = 'var(--brand-ridge)'
const ACCENT = 'var(--brand-accent)'
const CURRENT = 'var(--brand-current)'
const DEEP = 'var(--brand-deep)'

export type PublicationKind = 'article' | 'bulletin' | 'liturgy'

/** Recorte da geometria do símbolo, por natureza de publicação: cume para Artigo,
 * ondas para Boletim, templo para Liturgia. Substitui a Imagem Destacada quando ela
 * não existe e distingue os três tipos de conteúdo sem etiqueta colorida. */
const CROPS: Record<PublicationKind, string> = {
  article: '0 140 430 210',
  bulletin: '0 300 430 110',
  liturgy: '80 18 270 200',
}

/** Trechos distintos do cume, para que uma grade de Artigos sem Imagem Destacada
 * não repita o mesmo desenho em todos os cartões. */
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
      {kind === 'bulletin' ? null : <path d={HILL_FAR} fill={ACCENT} />}
      <path d={HILL_NEAR} fill={RIDGE} />
      {kind === 'bulletin' ? (
        <>
          <path d={WAVE_MID} fill={CURRENT} />
          <path d={WAVE_DEEP} fill={DEEP} />
        </>
      ) : null}
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
