import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createSong, softDeleteSong, updateSong, type CreateSongInput } from '@/db/queries/songs'
import { defineEntityAction } from '@/lib/entity-action'
import { serializedLyricsSchema } from '@/lib/lyrics'
import { slugify } from '@/lib/slug'
import { nullableTrimmedString } from '@/lib/validation'

const optionalPositiveInteger = z
  .string()
  .trim()
  .transform((value, context) => {
    if (!value) return null

    const number = Number(value)
    if (!Number.isInteger(number) || number < 1) {
      context.addIssue({ code: 'custom', message: 'Faixa deve ser um inteiro positivo' })
      return z.NEVER
    }

    return number
  })

const songFieldsSchema = z.object({
  title: z.string().trim().min(1, 'Título é obrigatório'),
  songwriter: nullableTrimmedString,
  performer: nullableTrimmedString,
  album: nullableTrimmedString,
  track: optionalPositiveInteger,
  lyrics: serializedLyricsSchema,
})

const createSongSchema = songFieldsSchema.transform((data) => ({
  ...data,
  slug: slugify(data.title),
}))

const updateSongSchema = songFieldsSchema.extend({
  id: z.coerce.number().int().positive('ID é obrigatório'),
})

const deleteSongSchema = z.object({
  id: z.coerce.number().int().positive('ID é obrigatório'),
})

export const createSongAction = defineEntityAction({
  entity: 'songs',
  action: 'create',
  schema: createSongSchema,
  write: ({ data, db }) => createSong(data satisfies CreateSongInput, db),
  revalidate: revalidateLiturgyPages,
  validationErrorMessage: lyricsValidationError,
})

export const updateSongAction = defineEntityAction({
  entity: 'songs',
  action: 'update',
  schema: updateSongSchema,
  write: ({ data, db }) =>
    updateSong(
      data.id,
      {
        title: data.title,
        songwriter: data.songwriter,
        performer: data.performer,
        album: data.album,
        track: data.track,
        lyrics: data.lyrics,
      },
      db
    ),
  revalidate: revalidateLiturgyPages,
  validationErrorMessage: lyricsValidationError,
})

export const deleteSongAction = defineEntityAction({
  entity: 'songs',
  action: 'delete',
  schema: deleteSongSchema,
  write: ({ data, db }) => softDeleteSong(data.id, db),
  revalidate: revalidateLiturgyPages,
})

function revalidateLiturgyPages() {
  revalidatePath('/liturgies/[slug]', 'page')
}

function lyricsValidationError(fieldErrors: Record<string, string[]>): string | undefined {
  return fieldErrors.lyrics ? 'Revise os blocos de letra.' : undefined
}
