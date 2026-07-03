'use server'

import type { ActionState } from '@/lib/entity-action'
import { createArticleAction, deleteArticleAction, updateArticleAction } from './actions'

export async function createArticle(prev: ActionState, formData: FormData): Promise<ActionState> {
  return createArticleAction.action(prev, formData)
}

export async function updateArticle(prev: ActionState, formData: FormData): Promise<ActionState> {
  return updateArticleAction.action(prev, formData)
}

export async function deleteArticle(prev: ActionState, formData: FormData): Promise<ActionState> {
  return deleteArticleAction.action(prev, formData)
}
