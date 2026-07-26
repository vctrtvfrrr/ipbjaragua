const NEAR_RIDGE = 'M0,66 C168,62 268,34 452,38 C636,42 748,12 936,16 C1124,20 1272,52 1440,44'
const FAR_RIDGE = 'M0,50 C200,46 296,20 476,26 C620,31 726,10 852,12'

export default function Horizon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 1440 100" preserveAspectRatio="none" className={className} role="presentation">
      <path d={`${NEAR_RIDGE} L1440,0 L0,0 Z`} fill="var(--brand-sky)" />
      <path d={FAR_RIDGE} fill="none" stroke="var(--brand-accent)" strokeWidth="2.5" strokeLinecap="round" />
      <path d={NEAR_RIDGE} fill="none" stroke="var(--brand-ridge)" strokeWidth="3" />
    </svg>
  )
}
