export const OG_SIZE = { width: 1200, height: 630 } as const

export const OG_CONTENT_TYPE = 'image/png'

export const CHURCH_NAME = 'IPB de Jaraguá do Sul'

/** Espelha os tokens da marca. Não há variável CSS aqui: o cartão é renderizado fora do
 * documento, então os valores são literais. `draft` é o único fora da paleta — sinaliza
 * um Rascunho, e a paleta não tem cor de alerta. */
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
