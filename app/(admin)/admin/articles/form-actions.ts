'use server'

import type { ActionState } from '@/lib/entity-action'
import { createArticleAction, deleteArticleAction, updateArticleAction } from './actions'

export async function createArticleFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return createArticleAction.action(prev, formData)
}

export async function updateArticleFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return updateArticleAction.action(prev, formData)
}

export async function deleteArticleFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return deleteArticleAction.action(prev, formData)
}
