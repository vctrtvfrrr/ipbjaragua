import { z } from 'zod'
import { parseISODate } from './date'

export const MEMBER_STATUSES = ['active', 'transferred', 'deceased', 'removed', 'pending'] as const
export const ECCLESIASTICAL_MEMBER_STATUSES = ['active', 'transferred', 'deceased', 'removed'] as const
export const SEXES = ['Masculino', 'Feminino'] as const
export const MARITAL_STATUSES = ['Solteiro(a)', 'Casado(a)', 'Viúvo(a)', 'Divorciado(a)', 'União estável'] as const

export type MemberStatus = (typeof MEMBER_STATUSES)[number]
export type Sex = (typeof SEXES)[number]
export type MaritalStatus = (typeof MARITAL_STATUSES)[number]

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  active: 'Ativo',
  transferred: 'Transferido',
  deceased: 'Falecido',
  removed: 'Removido',
  pending: 'Pendente',
}

const CURRENT_YEAR = new Date().getFullYear()

export const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null))

export const requiredTrimmedString = (message: string) => z.string().trim().min(1, message)

export const optionalYear = z
  .string()
  .trim()
  .optional()
  .transform((value, context) => {
    if (!value) return null
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed < 1900 || parsed > CURRENT_YEAR) {
      context.addIssue({ code: 'custom', message: `Informe um ano entre 1900 e ${CURRENT_YEAR}` })
      return z.NEVER
    }
    return parsed
  })

export const optionalISODate = z
  .string()
  .trim()
  .optional()
  .transform((value, context) => {
    if (!value) return null
    return parseDate(value, context)
  })

export const requiredISODate = (message: string) =>
  z
    .string()
    .trim()
    .transform((value, context) => {
      if (!value) {
        context.addIssue({ code: 'custom', message })
        return z.NEVER
      }
      return parseDate(value, context)
    })

function parseDate(value: string, context: z.RefinementCtx): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    context.addIssue({ code: 'custom', message: 'Data inválida' })
    return z.NEVER
  }

  const date = parseISODate(value)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    context.addIssue({ code: 'custom', message: 'Data inválida' })
    return z.NEVER
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (date > today) {
    context.addIssue({ code: 'custom', message: 'Data não pode ser futura' })
    return z.NEVER
  }

  return date
}

export const baseMemberFieldsSchema = z
  .object({
    email: z.string().trim().toLowerCase().pipe(z.email('E-mail inválido')),
    full_name: requiredTrimmedString('Nome completo é obrigatório'),
    birth_date: requiredISODate('Data de nascimento é obrigatória'),
    birth_place: optionalTrimmedString,
    nationality: optionalTrimmedString,
    mother: optionalTrimmedString,
    father: optionalTrimmedString,
    profession: optionalTrimmedString,
    education: optionalTrimmedString,
    marital_status: z.enum(MARITAL_STATUSES, 'Estado civil é obrigatório'),
    spouse: optionalTrimmedString,
    wedding_date: optionalISODate,
    address_street: requiredTrimmedString('Endereço é obrigatório'),
    address_number: requiredTrimmedString('Número é obrigatório'),
    address_complement: optionalTrimmedString,
    phone: requiredTrimmedString('Celular/Telefone é obrigatório'),
    home_church: requiredTrimmedString('Igreja de origem é obrigatória'),
    baptism_year: optionalYear,
    baptism_place: optionalTrimmedString,
    prof_faith_year: optionalYear,
    prof_faith_place: optionalTrimmedString,
  })
  .superRefine(validateMarriageFields)

export function validateMarriageFields(
  data: { marital_status: string | null; spouse: string | null; wedding_date: Date | null },
  context: z.RefinementCtx
) {
  if (data.marital_status !== 'Casado(a)' && data.marital_status !== 'União estável') return

  if (!data.spouse) {
    context.addIssue({ code: 'custom', path: ['spouse'], message: 'Cônjuge é obrigatório para este estado civil' })
  }
  if (!data.wedding_date) {
    context.addIssue({
      code: 'custom',
      path: ['wedding_date'],
      message: 'Data de casamento é obrigatória para este estado civil',
    })
  }
}

export function requiresMarriageFields(maritalStatus: string | null | undefined): boolean {
  return maritalStatus === 'Casado(a)' || maritalStatus === 'União estável'
}
