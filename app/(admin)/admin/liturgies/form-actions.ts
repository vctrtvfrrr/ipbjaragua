'use server'

import type { ActionState } from '@/lib/entity-action'
import { createLiturgyAction, deleteLiturgyAction, updateLiturgyAction } from './actions'

export async function createLiturgyFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return createLiturgyAction.action(prev, formData)
}

export async function updateLiturgyFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return updateLiturgyAction.action(prev, formData)
}

export async function deleteLiturgyFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return deleteLiturgyAction.action(prev, formData)
}
