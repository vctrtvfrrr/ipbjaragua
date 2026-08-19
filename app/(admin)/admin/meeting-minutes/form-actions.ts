'use server'

import type { ActionState } from '@/lib/entity-action'
import { createMeetingMinuteAction, updateMeetingMinuteAction } from './actions'

export async function createMeetingMinuteFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return createMeetingMinuteAction.action(prev, formData)
}

export async function updateMeetingMinuteFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return updateMeetingMinuteAction.action(prev, formData)
}
