'use server'

import type { ActionState } from '@/lib/entity-action'
import { articleDescriptionInput } from '@/lib/description-input'
import { generatePublicationDescription } from '@/lib/generate-description'
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

export async function generateArticleDescriptionAction(input: {
  mode: 'create' | 'edit'
  title: string
  content: string
}) {
  return generatePublicationDescription({
    entity: 'articles',
    action: input.mode === 'edit' ? 'update' : 'create',
    input: input.title.trim() && input.content.trim() ? articleDescriptionInput(input.title, input.content) : null,
    missingMessage: 'Preencha o título e o conteúdo antes de gerar o resumo.',
    failedMessage: 'Não foi possível gerar o resumo agora. Tente novamente.',
  })
}
