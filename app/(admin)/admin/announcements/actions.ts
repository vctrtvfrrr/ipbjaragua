import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  createAnnouncement,
  softDeleteAnnouncement,
  updateAnnouncement,
  type CreateAnnouncementInput,
} from '@/db/queries/announcements'
import { defineEntityAction } from '@/lib/entity-action'

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

const announcementFieldsSchema = z.object({
  title: z.string().trim().min(1, 'Título é obrigatório'),
  description: z.string().trim().min(1, 'Descrição é obrigatória'),
  url: optionalAbsoluteHttpUrl,
  expires_at: z.coerce.date(),
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
  schema: announcementFieldsSchema,
  write: ({ data, db }) => createAnnouncement(data satisfies CreateAnnouncementInput, db),
  revalidate: revalidateAnnouncementPages,
})

export const updateAnnouncementAction = defineEntityAction({
  entity: 'announcements',
  action: 'update',
  schema: updateAnnouncementSchema,
  write: ({ data, db }) =>
    updateAnnouncement(
      data.id,
      {
        title: data.title,
        description: data.description,
        url: data.url,
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

function revalidateAnnouncementPages() {
  revalidatePath('/')
  revalidatePath('/bulletins/[date]', 'page')
  revalidatePath('/admin/announcements', 'page')
  revalidatePath('/admin/announcements/new')
  revalidatePath('/admin/announcements/[id]/edit', 'page')
}
