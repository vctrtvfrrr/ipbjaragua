'use server'

import type { ActionState } from '@/lib/entity-action'
import {
  cancelInviteAction,
  createInviteAction,
  disableUserAction,
  reactivateUserAction,
  updateUserAction,
} from './actions'

export async function createInviteFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return createInviteAction.action(prev, formData)
}

export async function updateUserFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return updateUserAction.action(prev, formData)
}

export async function disableUserFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return disableUserAction.action(prev, formData)
}

export async function reactivateUserFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return reactivateUserAction.action(prev, formData)
}

export async function cancelInviteFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return cancelInviteAction.action(prev, formData)
}
