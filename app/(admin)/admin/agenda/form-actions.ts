'use server'

import type { ActionState } from '@/lib/entity-action'
import { createAgendaAction, deleteAgendaAction, updateAgendaAction } from './actions'

export async function createAgendaFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return createAgendaAction.action(prev, formData)
}

export async function updateAgendaFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return updateAgendaAction.action(prev, formData)
}

export async function deleteAgendaFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return deleteAgendaAction.action(prev, formData)
}
