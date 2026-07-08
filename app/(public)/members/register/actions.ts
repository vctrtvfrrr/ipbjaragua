'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { createPendingMember } from '@/db/queries/members'
import { db as defaultDb, type Database } from '@/db'
import { baseMemberFieldsSchema } from '@/lib/member'
import { fieldErrorsFrom, parseForm, type ActionState } from '@/lib/entity-action'
import { MEMBER_CONFIRMATION_EMAIL_WARNING, sendPublicMemberConfirmationEmail } from '@/lib/email/member'
import type { EmailEnv, SendMail } from '@/lib/email/mailer'
import { publicMemberInputFrom } from '@/lib/member-input'

const publicMemberSchema = baseMemberFieldsSchema.extend({
  website: z.string().optional(),
})

type PublicMemberDeps = {
  db?: Database
  env?: EmailEnv
  sendMail?: SendMail
  ip?: string
  rateLimit?: PublicMemberRateLimit
}

type PublicMemberRateLimit = {
  check: (key: string) => boolean
}

const rateBuckets = new Map<string, { count: number; resetAt: number }>()
const DEFAULT_LIMIT = 5
const WINDOW_MS = 60 * 60 * 1000

export async function submitPublicMemberRegistration(prev: ActionState, formData: FormData): Promise<ActionState> {
  void prev
  return executePublicMemberRegistration(formData)
}

export async function executePublicMemberRegistration(
  formData: FormData,
  deps: PublicMemberDeps = {}
): Promise<ActionState> {
  const ip = deps.ip ?? (await requestIp())
  const parsedForm = parseForm(formData)
  if (parsedForm.website) return { status: 'success' }

  const rateLimit = deps.rateLimit ?? defaultRateLimit
  if (!rateLimit.check(ip)) return { status: 'error', formError: 'Muitas tentativas. Tente novamente mais tarde.' }

  const parsedData = publicMemberSchema.safeParse(parsedForm)
  if (!parsedData.success) {
    return {
      status: 'error',
      fieldErrors: fieldErrorsFrom(parsedData.error.flatten().fieldErrors),
      values: parsedForm,
    }
  }

  const input = publicMemberInputFrom(parsedData.data)
  await createPendingMember(input, deps.db ?? defaultDb)

  try {
    const warning = await sendPublicMemberConfirmationEmail(input, { env: deps.env, sendMail: deps.sendMail })
    return warning ? { status: 'success', warning } : { status: 'success' }
  } catch {
    return { status: 'success', warning: MEMBER_CONFIRMATION_EMAIL_WARNING }
  }
}

async function requestIp(): Promise<string> {
  const headerList = await headers()
  return headerList.get('x-forwarded-for')?.split(',')[0]?.trim() || headerList.get('x-real-ip')?.trim() || 'unknown'
}

const defaultRateLimit: PublicMemberRateLimit = {
  check(key) {
    const now = Date.now()
    const current = rateBuckets.get(key)
    if (!current || current.resetAt <= now) {
      rateBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
      return true
    }

    if (current.count >= DEFAULT_LIMIT) return false
    current.count += 1
    return true
  },
}
