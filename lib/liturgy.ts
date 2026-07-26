import { z } from 'zod'
import { parseISODate } from '@/lib/date'
import { nullableTrimmedString, requiredTrimmedString } from '@/lib/validation'

export const MOMENT_TYPES = ['bible_reading', 'song', 'prayer', 'sermon', 'sacrament', 'pastoral_act', 'other'] as const

export const SACRAMENT_TYPES = ['baptism', 'eucharist'] as const

export const LITURGY_STATUSES = ['draft', 'published'] as const

export type MomentType = (typeof MOMENT_TYPES)[number]
export type SacramentType = (typeof SACRAMENT_TYPES)[number]
export type LiturgyStatus = (typeof LITURGY_STATUSES)[number]

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

// A draft may hold a half-filled passage (a reference with no text): completeness is a
// publication rule, not a storage one (see ADR-0020).
export const draftScripturePassageSchema = z.object({
  reference: nullableTrimmedString,
  text: nullableTrimmedString,
  version: nullableTrimmedString,
})

const liturgyMomentFields = z.object({
  id: z.number().int().positive().optional(),
  type: z.enum(MOMENT_TYPES),
  description: nullableTrimmedString,
  song_id: optionalId,
  scripture_passages: z.array(scripturePassageSchema),
  sermon_speaker: nullableTrimmedString,
  sacrament_type: z.enum(SACRAMENT_TYPES).nullable().optional(),
})

const draftLiturgyMomentFields = liturgyMomentFields.extend({
  scripture_passages: z.array(draftScripturePassageSchema),
})

type IssueSink = { addIssue: (issue: { code: 'custom'; path: PropertyKey[]; message: string }) => void }

// The DB check constraint `sacrament_type_required` applies regardless of draft/publish, so both
// variants below enforce it; the draft variant skips the completeness rules a half-built moment
// hasn't earned yet (see ADR-0020).
function requireSacramentType(moment: { type: MomentType; sacrament_type?: SacramentType | null }, context: IssueSink) {
  if (moment.type === 'sacrament' && !moment.sacrament_type) {
    context.addIssue({
      code: 'custom',
      path: ['sacrament_type'],
      message: 'Sacramento exige tipo',
    })
  }
}

export const liturgyMomentSchema = liturgyMomentFields.superRefine((moment, context) => {
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

  requireSacramentType(moment, context)
})

export const draftLiturgyMomentSchema = draftLiturgyMomentFields.superRefine(requireSacramentType)

export const liturgyActSchema = z.object({
  id: z.number().int().positive().optional(),
  name: requiredTrimmedString('Campo obrigatório'),
  moments: z.array(liturgyMomentSchema),
})

export const draftLiturgyActSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim(),
  moments: z.array(draftLiturgyMomentSchema),
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

// A draft relaxes completeness but still requires what the database does: date, time, service
// type and, for a sacrament, its kind.
export const draftLiturgyTreeSchema = z.object({
  date: liturgyTreeSchema.shape.date,
  theme: liturgyTreeSchema.shape.theme,
  time: liturgyTreeSchema.shape.time,
  description: liturgyTreeSchema.shape.description,
  acts: z.array(draftLiturgyActSchema),
})

function parseLiturgyTree(raw: Record<string, unknown>, status: LiturgyStatus | undefined, context: IssueSink) {
  const treeSchema = status === 'draft' ? draftLiturgyTreeSchema : liturgyTreeSchema
  const result = treeSchema.safeParse(raw)
  if (!result.success) {
    for (const issue of result.error.issues) {
      context.addIssue({ code: 'custom', path: issue.path, message: issue.message })
    }
    return undefined
  }
  return { ...result.data, date: parseISODate(result.data.date) }
}

export const createLiturgySchema = z
  .object({ status: z.enum(LITURGY_STATUSES, 'Campo obrigatório') })
  .passthrough()
  .transform((raw, context) => {
    const tree = parseLiturgyTree(raw, raw.status, context)
    return tree ? { status: raw.status, ...tree } : z.NEVER
  })

export const updateLiturgySchema = z
  .object({ id: z.number().int().positive('ID é obrigatório'), status: z.enum(LITURGY_STATUSES).optional() })
  .passthrough()
  .transform((raw, context) => {
    const tree = parseLiturgyTree(raw, raw.status, context)
    return tree ? { id: raw.id, status: raw.status, ...tree } : z.NEVER
  })

export const deleteLiturgySchema = z.object({
  id: z.number().int().positive('ID é obrigatório'),
})

export type LiturgyTreeInput = z.output<typeof createLiturgySchema>
export type LiturgyTreeUpdateInput = z.output<typeof updateLiturgySchema>
export type LiturgyMomentInput = LiturgyTreeInput['acts'][number]['moments'][number]

export function liturgyActLabel(act: { name: string }, index: number): string {
  return act.name.trim() || `Ato ${index + 1}`
}

export function buildLiturgyActErrorSummary(
  errors: Readonly<Record<string, string[]>>,
  acts: ReadonlyArray<{ name: string }>
): Array<{ actIndex: number; label: string; messages: string[] }> {
  const messagesByAct = new Map<number, string[]>()

  for (const [path, messages] of Object.entries(errors)) {
    const match = /^acts\.(\d+)\./.exec(path)
    if (!match) continue

    const actIndex = Number(match[1])
    if (!acts[actIndex]) continue
    messagesByAct.set(actIndex, [...(messagesByAct.get(actIndex) ?? []), ...messages])
  }

  return [...messagesByAct]
    .sort(([a], [b]) => a - b)
    .map(([actIndex, messages]) => ({
      actIndex,
      label: liturgyActLabel(acts[actIndex], actIndex),
      messages,
    }))
}

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

// The submit button that triggered the form carries the save intent as a `status` field
// (see LiturgyForm) — only that button's name/value pair reaches FormData, per the HTML spec.
export function parseSerializedLiturgyPayload(formData: FormData): unknown {
  const payload = formData.get('payload')
  if (typeof payload !== 'string') throw new Error('payload is required')
  const parsed = JSON.parse(payload)
  const status = formData.get('status')
  return typeof status === 'string' ? { ...(parsed as object), status } : parsed
}

type LiturgyDuplicationSource = {
  theme: string
  time: string
  description: string | null
  acts: Array<{
    name: string
    moments: Array<{
      type: MomentType
      description: string | null
      song_id: number | null
      scripture_passages: Array<{ reference: string | null; text: string | null; version: string | null }> | null
      sermon_speaker: string | null
      sacrament_type: SacramentType | null
    }>
  }>
}

export type LiturgyFormDefaults = {
  date: string
  theme: string
  time: string
  description: string
  acts: Array<{
    name: string
    moments: Array<{
      type: MomentType
      description: string
      song_id: number | null
      scripture_passages: Array<{ reference: string; text: string; version: string }>
      sermon_speaker: string
      sacrament_type: SacramentType | null
    }>
  }>
}

export function buildLiturgyDuplicationDefaults(
  source: LiturgyDuplicationSource,
  { suggestedDate, activeSongIds }: { suggestedDate: string; activeSongIds: ReadonlySet<number> }
): LiturgyFormDefaults {
  return {
    date: suggestedDate,
    theme: source.theme,
    time: source.time,
    description: source.description ?? '',
    acts: source.acts.map((act) => ({
      name: act.name,
      moments: act.moments.map((moment) => ({
        type: moment.type,
        description: moment.description ?? '',
        song_id: moment.song_id !== null && activeSongIds.has(moment.song_id) ? moment.song_id : null,
        scripture_passages: (moment.scripture_passages ?? []).map((passage) => ({
          reference: passage.reference ?? '',
          text: passage.text ?? '',
          version: passage.version ?? '',
        })),
        sermon_speaker: moment.sermon_speaker ?? '',
        sacrament_type: moment.sacrament_type,
      })),
    })),
  }
}
