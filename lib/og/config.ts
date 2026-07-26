export const OG_SIZE = { width: 1200, height: 630 } as const

export const OG_CONTENT_TYPE = 'image/png'

export const CHURCH_NAME = 'IPB de Jaraguá do Sul'

/** Literals, not CSS variables: the card renders outside the document. `draft` is the one
 * colour off the palette, which has no alert tone to flag a Rascunho with. */
export const OG_COLORS = {
  background: '#ffffff',
  ridge: '#386641',
  accent: '#6a994e',
  current: '#427aa1',
  sky: '#ebf2fa',
  ink: '#1f2937',
  gray: '#5a656e',
  draft: '#b3261e',
} as const
