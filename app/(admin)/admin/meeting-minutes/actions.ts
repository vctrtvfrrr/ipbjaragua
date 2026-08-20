import { revalidatePath } from 'next/cache'
import {
  approveMeetingMinute,
  createMeetingMinute,
  MeetingMinuteImmutableError,
  MeetingMinuteNotApprovedError,
  MeetingMinuteNotFoundError,
  MeetingMinuteNumberTakenError,
  updateMeetingMinute,
} from '@/db/queries/meeting-minutes'
import { defineEntityAction } from '@/lib/entity-action'
import {
  createMeetingMinuteSchema,
  meetingMinuteIdSchema,
  parseSerializedMeetingMinutePayload,
  updateMeetingMinuteSchema,
} from '@/lib/meeting-minute'
import {
  ensureMeetingMinutePdfCache,
  meetingMinutePdfFailureMessage,
  regenerateMeetingMinutePdfCache,
} from '@/lib/meeting-minute-pdf'

export const APPROVED_WITHOUT_PDF =
  'Ata aprovada, mas não foi possível gerar o PDF. Use “Gerar PDF” para tentar novamente.'

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

// The Status is committed alone, and everything after it lives in `notify`: the Aprovação is
// irreversible, so no later step may come back to the operator as a failed Aprovação. Only
// the request that moved the row does the extra work — a repeat has nothing left to add.
export const approveMeetingMinuteAction = defineEntityAction({
  entity: 'meeting_minutes',
  action: 'update',
  schema: meetingMinuteIdSchema,
  write: ({ data, db }) => approveMeetingMinute(data.id, db),
  notify: async (approval, { db }) => {
    try {
      if (approval.transitioned) await ensureMeetingMinutePdfCache(approval.minute.id, db)
    } finally {
      // The listing must be refreshed even when the document failed, or a consolidated Ata
      // goes on reading as Pendente.
      revalidatePath('/admin/meeting-minutes')
    }

    return undefined
  },
  notifyErrorMessage: () => APPROVED_WITHOUT_PDF,
  errorMessage: meetingMinuteErrorMessage,
})

// Reading is enough to rebuild the cache: the bytes are derived from an Ata nobody can
// change any more, so replacing them alters no record.
export const regenerateMeetingMinutePdfAction = defineEntityAction({
  entity: 'meeting_minutes',
  action: 'read',
  schema: meetingMinuteIdSchema,
  write: ({ data, db }) => regenerateMeetingMinutePdfCache(data.id, db),
  revalidate: () => revalidatePath('/admin/meeting-minutes'),
  errorMessage: (error) => meetingMinuteErrorMessage(error) ?? meetingMinutePdfFailureMessage(error),
})

function meetingMinuteErrorMessage(error: unknown): string | undefined {
  if (error instanceof MeetingMinuteNumberTakenError) return 'Já existe uma Ata com esse Número.'
  if (error instanceof MeetingMinuteNotFoundError) return 'Ata não encontrada.'
  if (error instanceof MeetingMinuteImmutableError) return 'Somente Atas Pendentes de aprovação podem ser editadas.'
  if (error instanceof MeetingMinuteNotApprovedError) return 'Somente Atas Aprovadas mantêm um PDF armazenado.'

  return undefined
}
