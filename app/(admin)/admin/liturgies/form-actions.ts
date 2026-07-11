'use server'

import type { ActionState } from '@/lib/entity-action'
import { liturgyDescriptionInput } from '@/lib/description-input'
import { generatePublicationDescription } from '@/lib/generate-description'
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

export async function generateLiturgyDescriptionAction(input: {
  mode: 'create' | 'edit'
  acts: Parameters<typeof liturgyDescriptionInput>[0]
}) {
  return generatePublicationDescription({
    entity: 'liturgies',
    action: input.mode === 'edit' ? 'update' : 'create',
    input: liturgyDescriptionInput(input.acts),
    missingMessage: 'Preencha o sermão ou o primeiro Ato antes de gerar a descrição.',
    failedMessage: 'Não foi possível gerar a descrição agora. Tente novamente.',
  })
}
