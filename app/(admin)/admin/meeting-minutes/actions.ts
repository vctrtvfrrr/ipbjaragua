import { revalidatePath } from 'next/cache'
import {
  approveMeetingMinute,
  createMeetingMinute,
  getMeetingMinuteBookOf,
  MeetingMinuteImmutableError,
  MeetingMinuteNotApprovedError,
  MeetingMinuteNotFoundError,
  MeetingMinuteNumberTakenError,
  updateMeetingMinute,
} from '@/db/queries/meeting-minutes'
import type { CurrentUser } from '@/lib/auth/current-user'
import type { Action } from '@/lib/authz'
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
import { meetingMinuteBookBySlug } from '@/lib/meeting-minute-books'

export const APPROVED_WITHOUT_PDF =
  'Ata aprovada, mas não foi possível gerar o PDF. Use “Gerar PDF” para tentar novamente.'

// An Ata of a Livro the Usuário cannot act on answers exactly like one that does not exist —
// the same "não encontrado" rule the routes already follow. Without this, the resolved scope
// would reach `defineEntityAction`'s own `can()` check, which denies with "sem permissão": a
// message an authenticated Usuário could use to tell an existing-but-sigiloso Ata apart from a
// truly missing one, just by trying every id against these actions.
async function scopeOfExistingMinute(
  user: CurrentUser,
  action: Action,
  id: number,
  db: Parameters<typeof getMeetingMinuteBookOf>[1]
): Promise<string> {
  const book = await getMeetingMinuteBookOf(id, db)
  if (!book || !user.can('meeting_minutes', action, book)) throw new MeetingMinuteNotFoundError(id)

  return book
}

function revalidateBook(book: string): void {
  revalidatePath(`/admin/meeting-minutes/${book}`)
}

export const createMeetingMinuteAction = defineEntityAction({
  entity: 'meeting_minutes',
  action: 'create',
  schema: createMeetingMinuteSchema,
  parse: parseSerializedMeetingMinutePayload,
  scope: ({ data }) => data.book,
  write: ({ data, db }) => createMeetingMinute(data, db),
  revalidate: ({ book }) => revalidateBook(book),
  validationErrorMessage: () => 'Revise a Ata antes de salvar.',
  errorMessage: meetingMinuteErrorMessage,
})

export const updateMeetingMinuteAction = defineEntityAction({
  entity: 'meeting_minutes',
  action: 'update',
  schema: updateMeetingMinuteSchema,
  parse: parseSerializedMeetingMinutePayload,
  scope: ({ user, data, db }) => scopeOfExistingMinute(user, 'update', data.id, db),
  write: ({ data, db }) => updateMeetingMinute(data.id, data, db),
  revalidate: ({ book }) => revalidateBook(book),
  validationErrorMessage: () => 'Revise a Ata antes de salvar.',
  errorMessage: meetingMinuteErrorMessage,
})

// The Status is committed alone, and everything after it lives in `notify`: the Aprovação is
// irreversível, so no later step may come back to the operator as a failed Aprovação. Only
// the request that moved the row does the extra work — a repeat has nothing left to add.
export const approveMeetingMinuteAction = defineEntityAction({
  entity: 'meeting_minutes',
  action: 'update',
  schema: meetingMinuteIdSchema,
  scope: ({ user, data, db }) => scopeOfExistingMinute(user, 'update', data.id, db),
  write: ({ data, db }) => approveMeetingMinute(data.id, db),
  notify: async (approval, { db }) => {
    try {
      const book = meetingMinuteBookBySlug(approval.minute.book)
      if (approval.transitioned && book) await ensureMeetingMinutePdfCache(approval.minute.id, book, db)
    } finally {
      // The listing must be refreshed even when the document failed, or a consolidated Ata
      // goes on reading as Pendente.
      revalidateBook(approval.minute.book)
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
  scope: ({ user, data, db }) => scopeOfExistingMinute(user, 'read', data.id, db),
  write: async ({ user, data, db }) => {
    // The scope resolver above already proved the row exists and named its Livro; this second
    // read is cheap and keeps `write` free of a duplicate not-found branch of its own.
    const book = meetingMinuteBookBySlug(await scopeOfExistingMinute(user, 'read', data.id, db))!

    return regenerateMeetingMinutePdfCache(data.id, book, db)
  },
  revalidate: (_result, { user, data, db }) => scopeOfExistingMinute(user, 'read', data.id, db).then(revalidateBook),
  errorMessage: (error) => meetingMinuteErrorMessage(error) ?? meetingMinutePdfFailureMessage(error),
})

function meetingMinuteErrorMessage(error: unknown): string | undefined {
  if (error instanceof MeetingMinuteNumberTakenError) return 'Já existe uma Ata com esse Número.'
  if (error instanceof MeetingMinuteNotFoundError) return 'Ata não encontrada.'
  if (error instanceof MeetingMinuteImmutableError) return 'Somente Atas Pendentes de aprovação podem ser editadas.'
  if (error instanceof MeetingMinuteNotApprovedError) return 'Somente Atas Aprovadas mantêm um PDF armazenado.'

  return undefined
}
