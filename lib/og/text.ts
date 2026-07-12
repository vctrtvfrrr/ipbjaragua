export const OG_TITLE_MAX_LINES = 4

const FONT_STEPS = [
  { maxLength: 24, size: 74 },
  { maxLength: 40, size: 62 },
  { maxLength: 64, size: 52 },
  { maxLength: 96, size: 44 },
  { maxLength: 140, size: 38 },
]

const OG_TITLE_MIN_SIZE = 32

// Progressively shrinks the title as it gets longer so short and unusually long
// titles both stay contained; the card clamps to OG_TITLE_MAX_LINES with an
// ellipsis as a last resort for anything that still overflows.
export function fitTitleFontSize(title: string): number {
  const length = title.trim().length
  for (const step of FONT_STEPS) {
    if (length <= step.maxLength) return step.size
  }
  return OG_TITLE_MIN_SIZE
}
