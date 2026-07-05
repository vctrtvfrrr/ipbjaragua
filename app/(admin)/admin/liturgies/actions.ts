import { revalidatePath } from 'next/cache'
import {
  createLiturgyTree,
  softDeleteLiturgy,
  updateLiturgyTree,
  type LiturgyTreeScopeError,
} from '@/db/queries/liturgies'
import { defineEntityAction } from '@/lib/entity-action'
import {
  createLiturgySchema,
  deleteLiturgySchema,
  parseSerializedLiturgyPayload,
  updateLiturgySchema,
} from '@/lib/liturgy'

export const createLiturgyAction = defineEntityAction({
  entity: 'liturgies',
  action: 'create',
  schema: createLiturgySchema,
  parse: parseSerializedLiturgyPayload,
  write: ({ data, db }) => createLiturgyTree(data, db),
  revalidate: revalidateLiturgyPages,
  validationErrorMessage: () => 'Revise a Liturgia antes de salvar.',
  errorMessage: liturgyErrorMessage,
})

export const updateLiturgyAction = defineEntityAction({
  entity: 'liturgies',
  action: 'update',
  schema: updateLiturgySchema,
  parse: parseSerializedLiturgyPayload,
  write: ({ data, db }) => updateLiturgyTree(data.id, data, db),
  revalidate: revalidateLiturgyPages,
  validationErrorMessage: () => 'Revise a Liturgia antes de salvar.',
  errorMessage: liturgyErrorMessage,
})

export const deleteLiturgyAction = defineEntityAction({
  entity: 'liturgies',
  action: 'delete',
  schema: deleteLiturgySchema,
  parse: parseSerializedLiturgyPayload,
  write: ({ data, db }) => softDeleteLiturgy(data.id, db),
  revalidate: revalidateLiturgyPages,
})

function revalidateLiturgyPages() {
  revalidatePath('/liturgies', 'page')
  revalidatePath('/liturgies/[slug]', 'page')
  revalidatePath('/admin/liturgies', 'page')
}

function liturgyErrorMessage(error: unknown): string | undefined {
  if (isTreeScopeError(error)) return 'A Liturgia enviada contém itens que não pertencem a ela.'
  return undefined
}

function isTreeScopeError(error: unknown): error is LiturgyTreeScopeError {
  return error instanceof Error && error.name === 'LiturgyTreeScopeError'
}
