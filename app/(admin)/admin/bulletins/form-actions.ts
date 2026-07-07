'use server'

import type { ActionState } from '@/lib/entity-action'
import { createBulletinAction, deleteBulletinAction, updateBulletinAction } from './actions'

export async function createBulletinFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return createBulletinAction.action(prev, formData)
}

export async function updateBulletinFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return updateBulletinAction.action(prev, formData)
}

export async function deleteBulletinFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return deleteBulletinAction.action(prev, formData)
}
