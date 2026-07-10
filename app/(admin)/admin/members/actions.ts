import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createMember, getMemberById, softDeleteMember, updateMember } from '@/db/queries/members'
import {
  ECCLESIASTICAL_MEMBER_STATUSES,
  MARITAL_STATUSES,
  MEMBER_STATUSES,
  optionalISODate,
  optionalYear,
  SEXES,
  validateMarriageFields,
} from '@/lib/member'
import { defineEntityAction, parseForm } from '@/lib/entity-action'
import { MEMBER_PROMOTION_EMAIL_WARNING, sendMemberPromotionEmail } from '@/lib/email/member'
import type { EmailEnv, SendMail } from '@/lib/email/mailer'
import { memberInputFrom } from '@/lib/member-input'
import { nullableTrimmedString as optionalTrimmedString, requiredTrimmedString } from '@/lib/validation'

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .optional()
  .transform((value, context) => {
    if (!value) return null
    const parsed = z.email('E-mail inválido').safeParse(value)
    if (!parsed.success) {
      context.addIssue({ code: 'custom', message: 'E-mail inválido' })
      return z.NEVER
    }
    return parsed.data
  })

const optionalMaritalStatus = z
  .enum(MARITAL_STATUSES)
  .optional()
  .or(z.literal(''))
  .transform((value) => (value ? value : null))

const adminMemberFieldsSchema = z
  .object({
    id: z.coerce.number().int().positive('ID é obrigatório').optional(),
    email: optionalEmail,
    full_name: requiredTrimmedString('Nome completo é obrigatório'),
    birth_date: optionalISODate,
    birth_place: optionalTrimmedString,
    nationality: optionalTrimmedString,
    mother: optionalTrimmedString,
    father: optionalTrimmedString,
    profession: optionalTrimmedString,
    education: optionalTrimmedString,
    marital_status: optionalMaritalStatus,
    spouse: optionalTrimmedString,
    wedding_date: optionalISODate,
    address_street: optionalTrimmedString,
    address_number: optionalTrimmedString,
    address_complement: optionalTrimmedString,
    phone: optionalTrimmedString,
    home_church: optionalTrimmedString,
    baptism_year: optionalYear,
    baptism_place: optionalTrimmedString,
    prof_faith_year: optionalYear,
    prof_faith_place: optionalTrimmedString,
    sex: z
      .enum(SEXES)
      .optional()
      .or(z.literal(''))
      .transform((value) => (value ? value : null)),
    status: z.enum(MEMBER_STATUSES),
    member_since: optionalISODate,
    member_until: optionalISODate,
    notify_promotion: z.boolean(),
  })
  .superRefine((data, context) => {
    validateMarriageFields(data, context)
    if (data.status !== 'pending' && !data.sex) {
      context.addIssue({
        code: 'custom',
        path: ['sex'],
        message: 'Sexo é obrigatório para status diferente de pendente',
      })
    }
  })

const createMemberSchema = adminMemberFieldsSchema.safeExtend({
  status: z.enum(ECCLESIASTICAL_MEMBER_STATUSES),
})

const updateMemberSchema = adminMemberFieldsSchema.safeExtend({
  id: z.coerce.number().int().positive('ID é obrigatório'),
})

const deleteMemberSchema = z.object({
  id: z.coerce.number().int().positive('ID é obrigatório'),
})

type MemberActionDeps = {
  env?: EmailEnv
  sendMail?: SendMail
}

export const createMemberAction = defineEntityAction({
  entity: 'members',
  action: 'create',
  schema: createMemberSchema,
  parse: parseMemberForm,
  write: ({ data, db }) => createMember(memberInputFrom(data), db),
  revalidate: revalidateMembers,
})

export const updateMemberAction = defineUpdateMemberAction()

export function defineUpdateMemberAction(deps: MemberActionDeps = {}) {
  return defineEntityAction({
    entity: 'members',
    action: 'update',
    schema: updateMemberSchema,
    parse: parseMemberForm,
    write: async ({ data, db }) => {
      const current = await getMemberById(data.id, db)
      if (data.status === 'pending' && current?.status !== 'pending') {
        throw new PendingStatusTransitionError()
      }
      const input = memberInputFrom(data)
      const member = await updateMember(data.id, input, db)
      return {
        member,
        input,
        shouldNotifyPromotion: Boolean(
          current?.status === 'pending' && data.status === 'active' && data.notify_promotion
        ),
      }
    },
    revalidate: revalidateMembers,
    notify: ({ input, shouldNotifyPromotion }) =>
      shouldNotifyPromotion ? sendMemberPromotionEmail(input, deps) : undefined,
    notifyErrorMessage: () => MEMBER_PROMOTION_EMAIL_WARNING,
    errorMessage: pendingStatusTransitionErrorMessage,
  })
}

export const deleteMemberAction = defineEntityAction({
  entity: 'members',
  action: 'delete',
  schema: deleteMemberSchema,
  write: ({ data, db }) => softDeleteMember(data.id, db),
  revalidate: revalidateMembers,
})

export function parseMemberForm(formData: FormData): unknown {
  const parsed = parseForm(formData)

  return {
    ...parsed,
    notify_promotion: parsed.notify_promotion === 'on',
  }
}

function revalidateMembers() {
  revalidatePath('/admin/members')
  revalidatePath('/admin/members/new')
  revalidatePath('/admin/members/[id]/edit', 'page')
  revalidatePath('/bulletins/[date]', 'page')
}

function pendingStatusTransitionErrorMessage(error: unknown): string | undefined {
  return error instanceof PendingStatusTransitionError
    ? 'Somente cadastros públicos pendentes podem permanecer como pendentes.'
    : undefined
}

class PendingStatusTransitionError extends Error {
  constructor() {
    super('Non-pending members cannot be moved to pending')
    this.name = 'PendingStatusTransitionError'
  }
}
