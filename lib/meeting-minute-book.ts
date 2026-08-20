import { z } from 'zod'
import { formatLongDatePtBR, isISODate, parseISODate } from '@/lib/date'

export const MEETING_MINUTE_BOOK_TITLE = 'Livro de Atas da Mesa Administrativa'

export const MEETING_MINUTE_BOOK_ORDERS = ['chronological', 'reverse'] as const

export type MeetingMinuteBookOrder = (typeof MEETING_MINUTE_BOOK_ORDERS)[number]

export const MEETING_MINUTE_BOOK_ORDER_LABELS: Record<MeetingMinuteBookOrder, string> = {
  chronological: 'Cronológica',
  reverse: 'Cronológica inversa',
}

// A Livro that failed has no partial form to offer, so the message points at the one lever the
// operator has: an export too large or too slow for one request becomes two smaller periods.
export const MEETING_MINUTE_BOOK_FAILURE =
  'Não foi possível gerar o Livro de Atas. Tente novamente ou selecione um período menor.'

export const MEETING_MINUTE_BOOK_EMPTY = 'Nenhuma Ata Aprovada no período selecionado.'

export const MEETING_MINUTE_BOOK_COUNTING = 'Consultando as Atas do período…'

export const MEETING_MINUTE_BOOK_INVALID = 'Informe um período válido.'

const isoDateField = z.string().trim().refine(isISODate, 'Informe uma data existente')

const periodFields = {
  from: isoDateField,
  to: isoDateField,
  order: z.enum(MEETING_MINUTE_BOOK_ORDERS),
}

const ORDERED_PERIOD = {
  path: ['to'],
  message: 'O fim do período não pode ser anterior ao início',
}

function isOrderedPeriod(period: { from: string; to: string }): boolean {
  return period.from <= period.to
}

export const meetingMinuteBookSchema = z.object(periodFields).refine(isOrderedPeriod, ORDERED_PERIOD)

// Aguardando and Gerando are the state of one export, not of the Livro in general: the browser
// mints a token per request so the server can answer about that operation and no other.
export const meetingMinuteBookRequestSchema = z
  .object({ ...periodFields, token: z.string().regex(/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/) })
  .refine(isOrderedPeriod, ORDERED_PERIOD)

export type MeetingMinuteBookInput = z.output<typeof meetingMinuteBookSchema>

export function meetingMinuteBookJob(token: string): string {
  return `meeting-minute-book:${token}`
}

// What a period holds: how many Atas Aprovadas and the Números at its edges, which are null
// only when it holds none.
export type MeetingMinuteBookSelection = { count: number; firstNumber: number | null; lastNumber: number | null }

export type MeetingMinuteBookSummary = MeetingMinuteBookInput & MeetingMinuteBookSelection

export function meetingMinuteBookPeriodLabel(period: { from: string; to: string }): string {
  return `${formatLongDatePtBR(parseISODate(period.from))} a ${formatLongDatePtBR(parseISODate(period.to))}`
}

// The interval always reads upwards, whatever order the Atas were bound in: it names the
// Números the Livro holds, not the sequence the reader will meet them in.
export function meetingMinuteBookFilename(interval: { firstNumber: number; lastNumber: number }): string {
  const [first, last] = [interval.firstNumber, interval.lastNumber].sort((a, b) => a - b)

  return `livro-de-atas-${first}-${last}.pdf`
}
