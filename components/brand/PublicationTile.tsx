const SKY = 'var(--brand-sky)'
const RIDGE = 'var(--brand-ridge)'
const ACCENT = 'var(--brand-accent)'
const CURRENT = 'var(--brand-current)'
const DEEP = 'var(--brand-deep)'

const HILL_FAR =
  'M133.69,273.53c80.98-61.29,81.6-62.1,148.84-116.2,19.94-18,27.19-10.49,46.26,3.9l101.1,84.7v116.5H133.69v-88.9Z'
const HILL_NEAR =
  'M429.79,362.33v-59.7c-29.68-24.92-74.74-59.83-103.1-81.8-13.3-9.2-28.62-8.72-42.9,4.1-10.76,9.7-20.74,17.67-32.22,27.18l-118.87-99.37c-16.96-14.7-26.93-15.34-43.9.1-18.12,14.47-45.97,37.26-88.8,69.8v138.5'
const WAVE_MID =
  'M425.89,335.03c-17.9,28.4-62.9,45.1-95.4,49.2-110.4,10.2-212.1-81.1-322.2-34.8,133.1-97,274.2,79.2,417.6-14.4h0Z'
const WAVE_DEEP = 'M301.49,398.63c-87.3,36.2-197.9-54.3-295.2-28.2,95.2-58,196.3,32.2,295.2,28.2Z'
const CHURCH_BODY =
  'M144.99,349.93v-100.4l35.6-30c.2-.2.4-.5.4-.8l-.2-64.4h63v64.4c0,.3.1.6.4.8l34.4,29.7v100.7h-133.7.1Z'
const CHURCH_DOOR =
  'M193.89,338.93v-48.9c0-11.2,7.5-20.6,16.5-26.3l1.6-.6,1.6.6c9.1,5.6,16.5,15,16.5,26.3v48.9h-36.5.3Z'
const CHURCH_WINDOW = 'M203.09,229.13v-25c0-5.7,3.7-10.6,8.2-13.5l.8-.3.8.3c4.5,2.9,8.2,7.7,8.2,13.5v25h-18,0Z'
const CHURCH_SPIRE =
  '179.79 153.33 244.79 153.33 214.59 56.93 214.59 39.23 222.69 39.23 222.69 34.73 214.59 34.73 214.59 27.73 210.09 27.73 210.09 34.73 201.99 34.73 201.99 39.23 210.09 39.23 210.09 56.93 179.79 153.33'

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
