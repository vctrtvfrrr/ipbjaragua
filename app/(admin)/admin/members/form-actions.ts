'use server'

import type { ActionState } from '@/lib/entity-action'
import { createMemberAction, deleteMemberAction, updateMemberAction } from './actions'

export async function createMemberFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return createMemberAction.action(prev, formData)
}

export async function updateMemberFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return updateMemberAction.action(prev, formData)
}

export async function deleteMemberFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return deleteMemberAction.action(prev, formData)
}
