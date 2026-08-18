import { z } from 'zod'
import type { MeetingMinuteStatus } from '@/db/schema'
import { parseChurchDateTime } from '@/lib/date'
import { CHURCH_NAME } from '@/lib/og/config'
import { requiredTrimmedString } from '@/lib/validation'

export const MEETING_MINUTE_STATUS_LABELS: Record<MeetingMinuteStatus, string> = {
  pending: 'Pendente de aprovação',
  approved: 'Aprovada',
}

export const DEFAULT_MEETING_MINUTE_TITLE = CHURCH_NAME

const REQUIRED = 'Campo obrigatório'
const EMPTY_MARKDOWN = 'Escreva um conteúdo, não apenas formatação'

const IMAGE = /!\[[^\]]*\]\([^)]+\)/
const WORD_CHARACTER = /[\p{L}\p{N}]/u

// Formatting alone is not content: the editor happily produces a heading marker, an
// empty list item or a table skeleton that carries no text the Ata can register.
export function hasMeaningfulMarkdown(value: string): boolean {
  if (IMAGE.test(value)) return true

  const text = value
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s*\d+[.)]\s*/gm, ' ')
    .replace(/[#>*_~`|\-+=\\]/g, ' ')

  return WORD_CHARACTER.test(text)
}

const markdownField = z
  .string()
  .trim()
  .superRefine((value, context) => {
    if (!value) context.addIssue({ code: 'custom', message: REQUIRED })
    else if (!hasMeaningfulMarkdown(value)) context.addIssue({ code: 'custom', message: EMPTY_MARKDOWN })
  })

const churchDateTimeField = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Informe data e horário')

export const meetingMinuteTopicSchema = z.object({
  title: requiredTrimmedString(REQUIRED),
  discussion: markdownField,
})

const meetingMinuteFields = z.object({
  number: z.coerce.number().int().positive('Número é obrigatório'),
  title: requiredTrimmedString(REQUIRED),
  started_at: churchDateTimeField,
  ended_at: churchDateTimeField,
  location: requiredTrimmedString(REQUIRED),
  attendees: markdownField,
  opening: markdownField,
  closing: markdownField,
  topics: z.array(meetingMinuteTopicSchema).min(1, 'A Ata exige ao menos um Tópico'),
})

export const createMeetingMinuteSchema = meetingMinuteFields.transform((raw, context) => {
  const started_at = parseChurchDateTime(raw.started_at)
  const ended_at = parseChurchDateTime(raw.ended_at)

  if (ended_at <= started_at) {
    context.addIssue({ code: 'custom', path: ['ended_at'], message: 'O Término deve ser posterior ao Início' })
    return z.NEVER
  }

  return { ...raw, started_at, ended_at }
})

export type CreateMeetingMinuteInput = z.output<typeof createMeetingMinuteSchema>

export function parseSerializedMeetingMinutePayload(formData: FormData): unknown {
  const payload = formData.get('payload')
  if (typeof payload !== 'string') throw new Error('payload is required')

  return JSON.parse(payload)
}

export function meetingMinuteTopicLabel(topic: { title: string }, index: number): string {
  return topic.title.trim() || `Tópico ${index + 1}`
}
