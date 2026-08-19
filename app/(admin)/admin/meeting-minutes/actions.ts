import { revalidatePath } from 'next/cache'
import {
  createMeetingMinute,
  MeetingMinuteImmutableError,
  MeetingMinuteNotFoundError,
  MeetingMinuteNumberTakenError,
  updateMeetingMinute,
} from '@/db/queries/meeting-minutes'
import { defineEntityAction } from '@/lib/entity-action'
import {
  createMeetingMinuteSchema,
  parseSerializedMeetingMinutePayload,
  updateMeetingMinuteSchema,
} from '@/lib/meeting-minute'

export const createMeetingMinuteAction = defineEntityAction({
  entity: 'meeting_minutes',
  action: 'create',
  schema: createMeetingMinuteSchema,
  parse: parseSerializedMeetingMinutePayload,
  write: ({ data, db }) => createMeetingMinute(data, db),
  revalidate: () => revalidatePath('/admin/meeting-minutes'),
  validationErrorMessage: () => 'Revise a Ata antes de salvar.',
  errorMessage: meetingMinuteErrorMessage,
})

export const updateMeetingMinuteAction = defineEntityAction({
  entity: 'meeting_minutes',
  action: 'update',
  schema: updateMeetingMinuteSchema,
  parse: parseSerializedMeetingMinutePayload,
  write: ({ data, db }) => updateMeetingMinute(data.id, data, db),
  revalidate: () => revalidatePath('/admin/meeting-minutes'),
  validationErrorMessage: () => 'Revise a Ata antes de salvar.',
  errorMessage: meetingMinuteErrorMessage,
})

function meetingMinuteErrorMessage(error: unknown): string | undefined {
  if (error instanceof MeetingMinuteNumberTakenError) return 'Já existe uma Ata com esse Número.'
  if (error instanceof MeetingMinuteNotFoundError) return 'Ata não encontrada.'
  if (error instanceof MeetingMinuteImmutableError) return 'Somente Atas Pendentes de aprovação podem ser editadas.'
  return undefined
}
