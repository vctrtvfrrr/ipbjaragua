import { revalidatePath } from 'next/cache'
import { createMeetingMinute, MeetingMinuteNumberTakenError } from '@/db/queries/meeting-minutes'
import { defineEntityAction } from '@/lib/entity-action'
import { createMeetingMinuteSchema, parseSerializedMeetingMinutePayload } from '@/lib/meeting-minute'

export const createMeetingMinuteAction = defineEntityAction({
  entity: 'meeting_minutes',
  action: 'create',
  schema: createMeetingMinuteSchema,
  parse: parseSerializedMeetingMinutePayload,
  write: ({ data, db }) => createMeetingMinute(data, db),
  revalidate: () => revalidatePath('/admin/meeting-minutes'),
  validationErrorMessage: () => 'Revise a Ata antes de salvar.',
  errorMessage: (error) =>
    error instanceof MeetingMinuteNumberTakenError ? 'Já existe uma Ata com esse Número.' : undefined,
})
