import { z } from 'zod'
import { parseISODate } from '@/lib/date'
import { nullableTrimmedString, requiredTrimmedString } from '@/lib/validation'

export const MOMENT_TYPES = ['bible_reading', 'song', 'prayer', 'sermon', 'sacrament', 'pastoral_act', 'other'] as const

export const SACRAMENT_TYPES = ['baptism', 'eucharist'] as const

export type MomentType = (typeof MOMENT_TYPES)[number]
export type SacramentType = (typeof SACRAMENT_TYPES)[number]

export const MOMENT_TYPE_LABELS: Record<MomentType, string> = {
  bible_reading: 'Leitura Bíblica',
  song: 'Cântico',
  prayer: 'Oração',
  sermon: 'Sermão',
  sacrament: 'Sacramento',
  pastoral_act: 'Ato pastoral',
  other: 'Outro',
}

export const SACRAMENT_TYPE_LABELS: Record<SacramentType, string> = {
  baptism: 'Batismo',
  eucharist: 'Santa Ceia',
}

const optionalId = z
  .union([z.number().int().positive(), z.null()])
  .optional()
  .transform((value) => value ?? null)

export const scripturePassageSchema = z.object({
  reference: requiredTrimmedString('Campo obrigatório'),
  text: requiredTrimmedString('Campo obrigatório'),
  version: requiredTrimmedString('Campo obrigatório'),
})

export const liturgyMomentSchema = z
  .object({
    id: z.number().int().positive().optional(),
    type: z.enum(MOMENT_TYPES),
    description: nullableTrimmedString,
    song_id: optionalId,
    scripture_passages: z.array(scripturePassageSchema),
    sermon_speaker: nullableTrimmedString,
    sacrament_type: z.enum(SACRAMENT_TYPES).nullable().optional(),
  })
  .superRefine((moment, context) => {
    if (moment.type === 'song' && !moment.song_id && !moment.description) {
      context.addIssue({
        code: 'custom',
        path: ['description'],
        message: 'Cântico exige música ou descrição',
      })
    }

    if (moment.type === 'bible_reading' && moment.scripture_passages.length < 1) {
      context.addIssue({
        code: 'custom',
        path: ['scripture_passages'],
        message: 'Leitura bíblica exige ao menos uma passagem',
      })
    }

    if (moment.type === 'sacrament' && !moment.sacrament_type) {
      context.addIssue({
        code: 'custom',
        path: ['sacrament_type'],
        message: 'Sacramento exige tipo',
      })
    }
  })

export const liturgyActSchema = z.object({
  id: z.number().int().positive().optional(),
  name: requiredTrimmedString('Campo obrigatório'),
  moments: z.array(liturgyMomentSchema),
})

export const liturgyTreeSchema = z.object({
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  theme: requiredTrimmedString('Campo obrigatório'),
  time: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/, 'Horário obrigatório'),
  description: nullableTrimmedString,
  acts: z.array(liturgyActSchema).min(1, 'Liturgia exige ao menos um Ato'),
})

export const createLiturgySchema = liturgyTreeSchema.transform((data) => ({
  ...data,
  date: parseISODate(data.date),
}))

export const updateLiturgySchema = liturgyTreeSchema
  .extend({ id: z.number().int().positive('ID é obrigatório') })
  .transform((data) => ({
    ...data,
    date: parseISODate(data.date),
  }))

export const deleteLiturgySchema = z.object({
  id: z.number().int().positive('ID é obrigatório'),
})

export type LiturgyTreeInput = z.output<typeof createLiturgySchema>
export type LiturgyMomentInput = LiturgyTreeInput['acts'][number]['moments'][number]

export function normalizeMomentForType(moment: LiturgyMomentInput) {
  return {
    type: moment.type,
    description: moment.description,
    song_id: moment.type === 'song' ? moment.song_id : null,
    scripture_passages:
      moment.type === 'bible_reading' || moment.type === 'sermon'
        ? moment.scripture_passages.map((passage) => ({
            reference: passage.reference,
            text: passage.text,
            version: passage.version,
          }))
        : null,
    sermon_speaker: moment.type === 'sermon' ? moment.sermon_speaker : null,
    sacrament_type: moment.type === 'sacrament' ? (moment.sacrament_type ?? null) : null,
  }
}

export function parseSerializedLiturgyPayload(formData: FormData): unknown {
  const payload = formData.get('payload')
  if (typeof payload !== 'string') throw new Error('payload is required')
  return JSON.parse(payload)
}
