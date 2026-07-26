import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Database } from '@/db'
import { createAgendaItem } from '@/db/queries/agenda'
import {
  createAnnouncement,
  getAnnouncementById,
  softDeleteAnnouncement,
  updateAnnouncement,
} from '@/db/queries/announcements'
import { defineEntityAction } from '@/lib/entity-action'
import { ANNOUNCEMENT_ICON_NAMES, DEFAULT_ANNOUNCEMENT_ICON } from '@/lib/announcement-icon'
import {
  ANNOUNCEMENT_FLYER_TYPES,
  InvalidAnnouncementFlyerError,
  MAX_ANNOUNCEMENT_FLYER_BYTES,
  normalizeAndStoreAnnouncementFlyer,
  removeAnnouncementFlyerFile,
} from '@/lib/announcement-flyer'

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
      // Swallowed: every rejection ends at the single domain error below.
    }

    context.addIssue({ code: 'custom', message: 'URL deve ser absoluta e começar com http:// ou https://' })
    return z.NEVER
  })

const iconSchema = z
  .enum(ANNOUNCEMENT_ICON_NAMES, { message: 'Ícone inválido' })
  .optional()
  .default(DEFAULT_ANNOUNCEMENT_ICON)

const checkboxBoolean = z
  .string()
  .optional()
  .transform((value) => value === 'on')

const optionalFlyer = z.preprocess(
  (value) => (value instanceof File && value.size === 0 ? undefined : value),
  z
    .instanceof(File)
    .refine((file) => ANNOUNCEMENT_FLYER_TYPES.includes(file.type as (typeof ANNOUNCEMENT_FLYER_TYPES)[number]), {
      message: 'Envie uma imagem PNG, JPEG ou WEBP.',
    })
    .refine((file) => file.size <= MAX_ANNOUNCEMENT_FLYER_BYTES, {
      message: 'O Flyer Digital deve ter no máximo 5 MB.',
    })
    .optional()
)

const announcementFieldsSchema = z.object({
  title: z.string().trim().min(1, 'Título é obrigatório'),
  description: z.string().trim().min(1, 'Descrição é obrigatória'),
  url: optionalAbsoluteHttpUrl,
  icon: iconSchema,
  flyer: optionalFlyer,
  expires_at: z.coerce.date(),
})

const createAnnouncementSchema = announcementFieldsSchema.extend({
  add_to_agenda: checkboxBoolean,
})

const updateAnnouncementSchema = announcementFieldsSchema.extend({
  id: z.coerce.number().int().positive('ID é obrigatório'),
  remove_flyer: checkboxBoolean,
})

const deleteAnnouncementSchema = z.object({
  id: z.coerce.number().int().positive('ID é obrigatório'),
})

export const createAnnouncementAction = defineEntityAction({
  entity: 'announcements',
  action: 'create',
  schema: createAnnouncementSchema,
  write: async ({ data, db, user }) => {
    if (data.add_to_agenda && !user.can('agenda', 'create')) throw new AgendaPermissionDeniedError()

    const flyerPath = data.flyer ? await normalizeAndStoreAnnouncementFlyer(data.flyer) : null
    try {
      return await db.transaction(async (tx) => {
        const announcement = await createAnnouncement(
          {
            title: data.title,
            description: data.description,
            url: data.url,
            icon: data.icon,
            flyer_path: flyerPath,
            expires_at: data.expires_at,
          },
          tx as Database
        )

        if (data.add_to_agenda) {
          await createAgendaItem(
            { title: announcement.title, description: null, event_date: announcement.expires_at, time: null },
            tx as Database
          )
        }

        return announcement
      })
    } catch (error) {
      if (flyerPath) await removeAnnouncementFlyerFile(flyerPath)
      throw error
    }
  },
  revalidate: revalidateAnnouncementPages,
  errorMessage: announcementErrorMessage,
})

export const updateAnnouncementAction = defineEntityAction({
  entity: 'announcements',
  action: 'update',
  schema: updateAnnouncementSchema,
  write: async ({ data, db }) => {
    const current = await getAnnouncementById(data.id, db)
    if (!current) return updateAnnouncement(data.id, {}, db)

    const newFlyerPath = data.flyer ? await normalizeAndStoreAnnouncementFlyer(data.flyer) : undefined
    const flyerPath = newFlyerPath ?? (data.remove_flyer ? null : current.flyer_path)

    try {
      const updated = await updateAnnouncement(
        data.id,
        {
          title: data.title,
          description: data.description,
          url: data.url,
          icon: data.icon,
          flyer_path: flyerPath,
          expires_at: data.expires_at,
        },
        db
      )
      if (current.flyer_path && current.flyer_path !== flyerPath) {
        await removeAnnouncementFlyerFile(current.flyer_path)
      }
      return updated
    } catch (error) {
      if (newFlyerPath) await removeAnnouncementFlyerFile(newFlyerPath)
      throw error
    }
  },
  revalidate: revalidateAnnouncementPages,
  errorMessage: announcementErrorMessage,
})

export const deleteAnnouncementAction = defineEntityAction({
  entity: 'announcements',
  action: 'delete',
  schema: deleteAnnouncementSchema,
  write: ({ data, db }) => softDeleteAnnouncement(data.id, db),
  revalidate: revalidateAnnouncementPages,
})

function announcementErrorMessage(error: unknown): string | undefined {
  if (error instanceof AgendaPermissionDeniedError) return AGENDA_PERMISSION_ERROR
  if (error instanceof InvalidAnnouncementFlyerError) return 'Envie uma imagem PNG, JPEG ou WEBP.'
  return undefined
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
