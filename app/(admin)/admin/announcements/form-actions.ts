'use server'

import type { ActionState } from '@/lib/entity-action'
import { createAnnouncementAction, deleteAnnouncementAction, updateAnnouncementAction } from './actions'

export async function createAnnouncementFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return createAnnouncementAction.action(prev, formData)
}

export async function updateAnnouncementFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return updateAnnouncementAction.action(prev, formData)
}

export async function deleteAnnouncementFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return deleteAnnouncementAction.action(prev, formData)
}
