'use server'

import { getCurrentUser } from '@/lib/auth/current-user'
import type { ActionState } from '@/lib/entity-action'
import { meetingMinuteBookSummary, type MeetingMinuteBookSummaryResult } from '@/lib/meeting-minute-book-pdf'
import {
  approveMeetingMinuteAction,
  createMeetingMinuteAction,
  regenerateMeetingMinutePdfAction,
  updateMeetingMinuteAction,
} from './actions'

function idFormData(id: number): FormData {
  const data = new FormData()
  data.append('id', String(id))

  return data
}

export async function createMeetingMinuteFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return createMeetingMinuteAction.action(prev, formData)
}

export async function updateMeetingMinuteFormAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return updateMeetingMinuteAction.action(prev, formData)
}

// Both confirmations carry a single Ata and no fields, so they take the id straight and
// leave the FormData plumbing here instead of asking a dialog to build one.
export async function approveMeetingMinuteFormAction(id: number): Promise<ActionState> {
  return approveMeetingMinuteAction.action({ status: 'idle' }, idFormData(id))
}

export async function regenerateMeetingMinutePdfFormAction(id: number): Promise<ActionState> {
  return regenerateMeetingMinutePdfAction.action({ status: 'idle' }, idFormData(id))
}

// The dialog asks the server what a period holds before it lets the operator commit to the
// export, so the count and the interval it shows are the ones the Livro will be built from.
export async function meetingMinuteBookSummaryFormAction(input: unknown): Promise<MeetingMinuteBookSummaryResult> {
  return meetingMinuteBookSummary(await getCurrentUser(), input)
}
