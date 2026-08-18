'use server'

import type { ActionState } from '@/lib/entity-action'
import { createMeetingMinuteAction } from './actions'

export async function createMeetingMinuteFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return createMeetingMinuteAction.action(prev, formData)
}
