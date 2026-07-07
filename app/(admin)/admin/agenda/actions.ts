import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  createAgendaItem,
  softDeleteAgendaItem,
  updateAgendaItem,
  type CreateAgendaItemInput,
} from '@/db/queries/agenda'
import { defineEntityAction } from '@/lib/entity-action'
import { parseISODate } from '@/lib/date'

const isoDateFromInput = z
  .string()
  .trim()
  .transform((value, context) => {
    if (!value) {
      context.addIssue({ code: 'custom', message: 'Data é obrigatória' })
      return z.NEVER
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      context.addIssue({ code: 'custom', message: 'Data inválida' })
      return z.NEVER
    }
    const date = parseISODate(value)
    if (Number.isNaN(date.getTime()) || value !== date.toISOString().slice(0, 10)) {
      context.addIssue({ code: 'custom', message: 'Data inválida' })
      return z.NEVER
    }
    return date
  })

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null))

const agendaFieldsSchema = z.object({
  title: z.string().trim().min(1, 'Título é obrigatório'),
  description: optionalTrimmedString,
  event_date: isoDateFromInput,
  time: optionalTrimmedString,
})

const updateAgendaSchema = agendaFieldsSchema.extend({
  id: z.coerce.number().int().positive('ID é obrigatório'),
})

const deleteAgendaSchema = z.object({
  id: z.coerce.number().int().positive('ID é obrigatório'),
})

export const createAgendaAction = defineEntityAction({
  entity: 'agenda',
  action: 'create',
  schema: agendaFieldsSchema,
  write: ({ data, db }) => createAgendaItem(data satisfies CreateAgendaItemInput, db),
  revalidate: revalidateAgendaPages,
})

export const updateAgendaAction = defineEntityAction({
  entity: 'agenda',
  action: 'update',
  schema: updateAgendaSchema,
  write: ({ data, db }) =>
    updateAgendaItem(
      data.id,
      {
        title: data.title,
        description: data.description,
        event_date: data.event_date,
        time: data.time,
      },
      db
    ),
  revalidate: revalidateAgendaPages,
})

export const deleteAgendaAction = defineEntityAction({
  entity: 'agenda',
  action: 'delete',
  schema: deleteAgendaSchema,
  write: ({ data, db }) => softDeleteAgendaItem(data.id, db),
  revalidate: revalidateAgendaPages,
})

function revalidateAgendaPages() {
  revalidatePath('/')
  revalidatePath('/bulletins/[date]', 'page')
  revalidatePath('/admin/agenda', 'page')
  revalidatePath('/admin/agenda/new')
  revalidatePath('/admin/agenda/[id]/edit', 'page')
}
