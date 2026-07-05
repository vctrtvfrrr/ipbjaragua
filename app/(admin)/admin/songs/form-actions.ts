'use server'

import type { ActionState } from '@/lib/entity-action'
import { createSongAction, deleteSongAction, updateSongAction } from './actions'

export async function createSongFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return createSongAction.action(prev, formData)
}

export async function updateSongFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return updateSongAction.action(prev, formData)
}

export async function deleteSongFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return deleteSongAction.action(prev, formData)
}
