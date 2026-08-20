import { z } from 'zod'
import type { MeetingMinuteBookSelection } from '@/db/queries/meeting-minutes'
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

export const MEETING_MINUTE_BOOK_INVALID = 'Informe um período válido.'

const isoDateField = z.string().trim().refine(isISODate, 'Informe uma data existente')

export const meetingMinuteBookSchema = z
  .object({
    from: isoDateField,
    to: isoDateField,
    order: z.enum(MEETING_MINUTE_BOOK_ORDERS),
  })
  .refine((period) => period.from <= period.to, {
    path: ['to'],
    message: 'O fim do período não pode ser anterior ao início',
  })

export type MeetingMinuteBookInput = z.output<typeof meetingMinuteBookSchema>

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
