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

/** The symbol's landscape released from its circular crop, so it can span the hero.
 * This is not the logo: never use it where the brand mark belongs. */
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
