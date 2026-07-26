import {
  CHURCH_BODY,
  CHURCH_DOOR,
  CHURCH_SPIRE,
  CHURCH_WINDOW,
  HILL_FAR,
  HILL_NEAR,
  SKY_DOME,
  WAVE_DEEP,
  WAVE_MID,
} from '@/components/brand/symbol'

/**
 * A paisagem do símbolo sem o recorte circular da marca: a cúpula fica como campo
 * claro atrás do templo enquanto cumes e ondas seguem além dela, para a composição
 * respirar na largura do herói. Não é o logo — é a mesma matriz aberta em cena.
 */
export default function HeroScene({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      role="presentation"
      viewBox="-6 14 442 392"
      preserveAspectRatio="xMidYMax meet"
      className={className}
    >
      <path d={SKY_DOME} fill="#ffffff" />
      <path d={HILL_FAR} fill="var(--brand-accent)" />
      <path d={HILL_NEAR} fill="var(--brand-ridge)" />
      <path d={CHURCH_BODY} fill="#ffffff" stroke="var(--brand-ridge)" strokeWidth="2" />
      <polygon points={CHURCH_SPIRE} fill="var(--brand-ridge)" />
      <path d={CHURCH_DOOR} fill="var(--brand-ridge)" />
      <path d={CHURCH_WINDOW} fill="var(--brand-ridge)" />
      <path d={WAVE_MID} fill="var(--brand-current)" />
      <path d={WAVE_DEEP} fill="var(--brand-deep)" />
    </svg>
  )
}
