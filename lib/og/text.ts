export const OG_TITLE_MAX_LINES = 4

const FONT_STEPS = [
  { maxLength: 24, size: 74 },
  { maxLength: 40, size: 62 },
  { maxLength: 64, size: 52 },
  { maxLength: 96, size: 44 },
  { maxLength: 140, size: 38 },
]

const OG_TITLE_MIN_SIZE = 32

// Keeps both short and unusually long titles inside the card, which cannot reflow.
export function fitTitleFontSize(title: string): number {
  const length = title.trim().length
  for (const step of FONT_STEPS) {
    if (length <= step.maxLength) return step.size
  }
  return OG_TITLE_MIN_SIZE
}
