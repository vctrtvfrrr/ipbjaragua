'use server'

import { revalidatePath } from 'next/cache'
import { db as defaultDb, type Database } from '@/db'
import { createFeaturedImage, deleteFeaturedImage, getFeaturedImageById } from '@/db/queries/featured-images'
import { getCurrentUser, type CurrentUser } from '@/lib/auth/current-user'
import { type ActionState, requirePermission } from '@/lib/entity-action'
import { normalizeAndStoreFeaturedImage, removeFeaturedImageFile } from '@/lib/featured-image'

type Context = { user: CurrentUser | null; db: Database }

async function executeUploadFeaturedImage(context: Context, formData: FormData): Promise<ActionState> {
  const denied = requirePermission(context.user, 'featured_images', 'create')
  if (denied) return denied
  const file = formData.get('image')
  if (!(file instanceof File)) return { status: 'error', formError: 'Selecione uma imagem.' }

  let path: string | undefined
  try {
    path = await normalizeAndStoreFeaturedImage(file)
    await createFeaturedImage(path, context.db)
    revalidatePath('/admin/featured-images')
    return { status: 'success' }
  } catch (error) {
    if (path) await removeFeaturedImageFile(path)
    return { status: 'error', formError: error instanceof Error ? error.message : 'Não foi possível enviar a imagem.' }
  }
}

async function executeDeleteFeaturedImage(context: Context, formData: FormData): Promise<ActionState> {
  const denied = requirePermission(context.user, 'featured_images', 'delete')
  if (denied) return denied
  const id = Number(formData.get('id'))
  if (!Number.isInteger(id) || id <= 0) return { status: 'error', formError: 'Imagem inválida.' }
  try {
    const image = await getFeaturedImageById(id, context.db)
    if (!image) throw new Error('Imagem não encontrada')
    await removeFeaturedImageFile(image.path)
    await deleteFeaturedImage(id, context.db)
    revalidatePath('/admin/featured-images')
    revalidatePath('/')
    revalidatePath('/articles')
    return { status: 'success' }
  } catch {
    return { status: 'error', formError: 'Não foi possível excluir a imagem.' }
  }
}

export async function uploadFeaturedImageAction(_state: ActionState, formData: FormData) {
  return executeUploadFeaturedImage({ user: await getCurrentUser(), db: defaultDb }, formData)
}

export async function deleteFeaturedImageAction(_state: ActionState, formData: FormData) {
  return executeDeleteFeaturedImage({ user: await getCurrentUser(), db: defaultDb }, formData)
}
