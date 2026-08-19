import { z } from 'zod'
import type { MeetingMinuteStatus } from '@/db/schema'
import { isChurchDateTime, parseChurchDateTime } from '@/lib/date'
import { requiredTrimmedString } from '@/lib/validation'

export const MEETING_MINUTE_STATUS_LABELS: Record<MeetingMinuteStatus, string> = {
  pending: 'Aprovação pendente',
  approved: 'Aprovada',
}

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

const churchDateTimeField = z.string().trim().refine(isChurchDateTime, 'Informe uma data e um horário existentes')

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

function parseChurchTimes<T extends z.output<typeof meetingMinuteFields>>(
  raw: T,
  context: z.RefinementCtx
): Omit<T, 'started_at' | 'ended_at'> & { started_at: Date; ended_at: Date } {
  const started_at = parseChurchDateTime(raw.started_at)
  const ended_at = parseChurchDateTime(raw.ended_at)

  if (ended_at <= started_at) {
    context.addIssue({ code: 'custom', path: ['ended_at'], message: 'O Término deve ser posterior ao Início' })
    return z.NEVER
  }

  return { ...raw, started_at, ended_at }
}

export const createMeetingMinuteSchema = meetingMinuteFields.transform(parseChurchTimes)

export const updateMeetingMinuteSchema = meetingMinuteFields
  .extend({ id: z.coerce.number().int().positive('ID é obrigatório') })
  .transform(parseChurchTimes)

export type CreateMeetingMinuteInput = z.output<typeof createMeetingMinuteSchema>

export function parseSerializedMeetingMinutePayload(formData: FormData): unknown {
  const payload = formData.get('payload')
  if (typeof payload !== 'string') throw new Error('payload is required')

  return JSON.parse(payload)
}

export type MeetingMinuteYearNavigation = {
  year: number
  previousYear: number | null
  nextYear: number | null
}

// The oldest Ata anchors the walk: before it there is nothing to find, and a year ahead of
// today is never offered. Anything outside those bounds falls back to the current year.
export function resolveMeetingMinuteYearNavigation(
  raw: string | undefined,
  bounds: { earliestYear: number | null; currentYear: number }
): MeetingMinuteYearNavigation {
  const { currentYear } = bounds
  const oldestYear = Math.min(bounds.earliestYear ?? currentYear, currentYear)
  const asked = Number(raw)
  const year = Number.isInteger(asked) && asked >= oldestYear && asked <= currentYear ? asked : currentYear

  return {
    year,
    previousYear: year > oldestYear ? year - 1 : null,
    nextYear: year < currentYear ? year + 1 : null,
  }
}

export function meetingMinuteTopicLabel(topic: { title: string }, index: number): string {
  return topic.title.trim() || `Tópico ${index + 1}`
}

export function meetingMinuteLabel(minute: { number: number; title: string }): string {
  return `Ata nº ${minute.number} — ${minute.title}`
}

export const MEETING_MINUTE_TOPIC_TITLE_LIMIT = 60

// The limit counts what a reader sees, so it counts graphemes: slicing by code unit cuts an
// accent off its letter and halves an emoji into a replacement character.
const graphemes = new Intl.Segmenter('pt-BR', { granularity: 'grapheme' })

export function abbreviateMeetingMinuteTopicTitle(title: string): string {
  const segments = [...graphemes.segment(title)]
  if (segments.length <= MEETING_MINUTE_TOPIC_TITLE_LIMIT) return title

  const head = title.slice(0, segments[MEETING_MINUTE_TOPIC_TITLE_LIMIT].index)
  const lastSpace = head.lastIndexOf(' ')

  return `${lastSpace === -1 ? head : head.slice(0, lastSpace)}…`
}
