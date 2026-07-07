import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  BulletinArticleNotEligibleError,
  BulletinCorrectionWindowError,
  BulletinNotFoundError,
  BulletinUniqueConstraintError,
  createBulletin,
  deleteBulletin,
  updateBulletin,
  type CreateBulletinInput,
} from '@/db/queries/bulletins-write'
import { formatISODate, today } from '@/lib/date'
import { defineEntityAction } from '@/lib/entity-action'

const bulletinFieldsSchema = z.object({
  title: z.string().trim().min(1, 'Título é obrigatório'),
  date: z.coerce.date(),
  edition: z.coerce.number().int().positive('Edição é obrigatória'),
  article_id: z.coerce.number().int().positive().nullable(),
  show_announcements: z.boolean(),
  show_agenda: z.boolean(),
  show_birthdays: z.boolean(),
})

const updateBulletinSchema = bulletinFieldsSchema.extend({
  id: z.coerce.number().int().positive('ID é obrigatório'),
  oldDate: z.coerce.date(),
})

const deleteBulletinSchema = z.object({
  id: z.coerce.number().int().positive('ID é obrigatório'),
})

export const createBulletinAction = defineEntityAction({
  entity: 'bulletins',
  action: 'create',
  schema: bulletinFieldsSchema,
  parse: parseBulletinForm,
  write: ({ data, db }) => createBulletin(data satisfies CreateBulletinInput, db),
  revalidate: (row) => revalidateBulletinPaths(row.date),
  errorMessage: bulletinActionErrorMessage,
})

export const updateBulletinAction = defineEntityAction({
  entity: 'bulletins',
  action: 'update',
  schema: updateBulletinSchema,
  parse: parseBulletinForm,
  write: ({ data, db }) => {
    return updateBulletin(
      data.id,
      {
        title: data.title,
        date: data.date,
        edition: data.edition,
        article_id: data.article_id,
        show_announcements: data.show_announcements,
        show_agenda: data.show_agenda,
        show_birthdays: data.show_birthdays,
      },
      { today: today(), now: new Date() },
      db
    )
  },
  revalidate: (row, { data }) => {
    revalidateBulletinPaths(data.oldDate)
    revalidateBulletinPaths(row.date)
    revalidatePath('/admin/bulletins')
  },
  errorMessage: bulletinActionErrorMessage,
})

export const deleteBulletinAction = defineEntityAction({
  entity: 'bulletins',
  action: 'delete',
  schema: deleteBulletinSchema,
  write: ({ data, db }) => deleteBulletin(data.id, { today: today(), now: new Date() }, db),
  revalidate: (row) => {
    revalidateBulletinPaths(row.date)
    revalidatePath('/admin/bulletins')
  },
  errorMessage: bulletinActionErrorMessage,
})

function parseBulletinForm(formData: FormData): Record<string, unknown> {
  return {
    id: stringValue(formData, 'id'),
    oldDate: stringValue(formData, 'oldDate'),
    title: stringValue(formData, 'title'),
    date: stringValue(formData, 'date'),
    edition: stringValue(formData, 'edition'),
    article_id: nullableNumberValue(formData, 'article_id'),
    show_announcements: formData.has('show_announcements'),
    show_agenda: formData.has('show_agenda'),
    show_birthdays: formData.has('show_birthdays'),
  }
}

function stringValue(formData: FormData, name: string): string | undefined {
  const value = formData.get(name)
  return typeof value === 'string' ? value : undefined
}

function nullableNumberValue(formData: FormData, name: string): string | null | undefined {
  const value = stringValue(formData, name)
  if (value === undefined) return undefined
  return value === '' ? null : value
}

function bulletinActionErrorMessage(error: unknown): string | undefined {
  if (error instanceof BulletinUniqueConstraintError) {
    return error.field === 'date' ? 'Já existe um boletim nessa data.' : 'Já existe um boletim com essa edição.'
  }

  if (error instanceof BulletinArticleNotEligibleError) return 'Selecione um artigo existente.'
  if (error instanceof BulletinCorrectionWindowError) {
    return 'Este boletim está fora da Janela de Correção para alterar a data ou excluir.'
  }
  if (error instanceof BulletinNotFoundError) return 'Boletim não encontrado.'

  return undefined
}

function revalidateBulletinPaths(date: Date) {
  revalidatePath('/')
  revalidatePath('/bulletins')
  revalidatePath(`/bulletins/${formatISODate(date)}`)
}
