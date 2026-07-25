import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Database } from '@/db'
import { createAgendaItem } from '@/db/queries/agenda'
import {
  createAnnouncement,
  softDeleteAnnouncement,
  updateAnnouncement,
  type CreateAnnouncementInput,
} from '@/db/queries/announcements'
import { defineEntityAction } from '@/lib/entity-action'
import { ANNOUNCEMENT_ICON_NAMES, DEFAULT_ANNOUNCEMENT_ICON } from '@/lib/announcement-icon'

const AGENDA_PERMISSION_ERROR = 'Você não tem permissão para executar esta ação.'

const optionalAbsoluteHttpUrl = z
  .string()
  .trim()
  .optional()
  .transform((value, context) => {
    if (!value) return null

    try {
      const url = new URL(value)
      if (url.protocol === 'http:' || url.protocol === 'https:') return url.toString()
    } catch {
      // Fall through to the single domain error below.
    }

    context.addIssue({ code: 'custom', message: 'URL deve ser absoluta e começar com http:// ou https://' })
    return z.NEVER
  })

const iconSchema = z
  .enum(ANNOUNCEMENT_ICON_NAMES, { message: 'Ícone inválido' })
  .optional()
  .default(DEFAULT_ANNOUNCEMENT_ICON)

const nullableFeaturedImageId = z.coerce.number().int().positive().nullable()

const announcementFieldsSchema = z.object({
  title: z.string().trim().min(1, 'Título é obrigatório'),
  description: z.string().trim().min(1, 'Descrição é obrigatória'),
  url: optionalAbsoluteHttpUrl,
  icon: iconSchema,
  featured_image_id: nullableFeaturedImageId,
  expires_at: z.coerce.date(),
})

const createAnnouncementSchema = announcementFieldsSchema.extend({
  add_to_agenda: z.boolean(),
})

const updateAnnouncementSchema = announcementFieldsSchema.extend({
  id: z.coerce.number().int().positive('ID é obrigatório'),
})

const deleteAnnouncementSchema = z.object({
  id: z.coerce.number().int().positive('ID é obrigatório'),
})

export const createAnnouncementAction = defineEntityAction({
  entity: 'announcements',
  action: 'create',
  schema: createAnnouncementSchema,
  parse: parseCreateAnnouncementForm,
  write: ({ data, db, user }) => {
    if (data.add_to_agenda && !user.can('agenda', 'create')) throw new AgendaPermissionDeniedError()

    return db.transaction(async (tx) => {
      const announcement = await createAnnouncement(data satisfies CreateAnnouncementInput, tx as Database)

      if (data.add_to_agenda) {
        await createAgendaItem(
          { title: announcement.title, description: null, event_date: announcement.expires_at, time: null },
          tx as Database
        )
      }

      return announcement
    })
  },
  revalidate: revalidateAnnouncementPages,
  errorMessage: agendaPermissionErrorMessage,
})

export const updateAnnouncementAction = defineEntityAction({
  entity: 'announcements',
  action: 'update',
  schema: updateAnnouncementSchema,
  parse: parseAnnouncementForm,
  write: ({ data, db }) =>
    updateAnnouncement(
      data.id,
      {
        title: data.title,
        description: data.description,
        url: data.url,
        icon: data.icon,
        featured_image_id: data.featured_image_id,
        expires_at: data.expires_at,
      },
      db
    ),
  revalidate: revalidateAnnouncementPages,
})

export const deleteAnnouncementAction = defineEntityAction({
  entity: 'announcements',
  action: 'delete',
  schema: deleteAnnouncementSchema,
  write: ({ data, db }) => softDeleteAnnouncement(data.id, db),
  revalidate: revalidateAnnouncementPages,
})

function parseAnnouncementForm(formData: FormData): Record<string, unknown> {
  return {
    id: stringValue(formData, 'id'),
    title: stringValue(formData, 'title'),
    description: stringValue(formData, 'description'),
    url: stringValue(formData, 'url'),
    icon: stringValue(formData, 'icon'),
    featured_image_id: nullableNumberValue(formData, 'featured_image_id'),
    expires_at: stringValue(formData, 'expires_at'),
  }
}

function parseCreateAnnouncementForm(formData: FormData): Record<string, unknown> {
  return {
    ...parseAnnouncementForm(formData),
    add_to_agenda: formData.has('add_to_agenda'),
  }
}

function stringValue(formData: FormData, name: string): string | undefined {
  const value = formData.get(name)
  return typeof value === 'string' ? value : undefined
}

function nullableNumberValue(formData: FormData, name: string): string | null {
  const value = stringValue(formData, name)
  return value ? value : null
}

function agendaPermissionErrorMessage(error: unknown): string | undefined {
  return error instanceof AgendaPermissionDeniedError ? AGENDA_PERMISSION_ERROR : undefined
}

class AgendaPermissionDeniedError extends Error {
  constructor() {
    super('User cannot create an agenda item indirectly without agenda create permission')
    this.name = 'AgendaPermissionDeniedError'
  }
}

function revalidateAnnouncementPages() {
  revalidatePath('/')
  revalidatePath('/bulletins/[date]', 'page')
  revalidatePath('/admin/announcements', 'page')
  revalidatePath('/admin/announcements/new')
  revalidatePath('/admin/announcements/[id]/edit', 'page')
  revalidatePath('/admin/agenda', 'page')
}
