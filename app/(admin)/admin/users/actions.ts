import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import {
  createInvite,
  deletePendingInvite,
  setUserStatus,
  updateUserPermissions,
  UserEmailCollisionError,
} from '@/db/queries/users'
import { defineEntityAction } from '@/lib/entity-action'
import {
  isDeclaredPermission,
  PERMISSION_ACTIONS,
  PERMISSION_CATALOG,
  PERMISSION_ENTITIES,
  USER_MANAGEMENT_PERMISSIONS,
  type Permission,
} from '@/lib/authz'
import { INVITE_EMAIL_WARNING, sendInviteEmail, type EmailEnv, type SendMail } from '@/lib/email/invite'
import { getPublicOriginFromHeaders } from '@/lib/http/request-origin'
import { permissionFormValue } from '@/lib/permission-form'
import { nullableTrimmedString } from '@/lib/validation'

const permissionSchema = z
  .object({
    entity: z.enum(PERMISSION_ENTITIES, { error: 'Permissão inválida.' }),
    action: z.enum(PERMISSION_ACTIONS, { error: 'Permissão inválida.' }),
  })
  .refine(({ entity, action }) => isDeclaredPermission(entity, action), 'Permissão inválida.')

const permissionsSchema = z
  .array(permissionSchema)
  .min(1, 'Escolha ao menos uma permissão.')
  .transform(normalizePermissions)

const createInviteSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('E-mail inválido')),
  name: nullableTrimmedString,
  permissions: permissionsSchema,
})

const updateUserSchema = z.object({
  id: z.coerce.number().int().positive('ID é obrigatório'),
  name: nullableTrimmedString,
  permissions: permissionsSchema,
})

const userIdSchema = z.object({
  id: z.coerce.number().int().positive('ID é obrigatório'),
})

type CreateInviteActionDeps = {
  env?: EmailEnv
  panelUrl?: URL
  sendMail?: SendMail
}

export const createInviteAction = defineCreateInviteAction()

export function defineCreateInviteAction(deps: CreateInviteActionDeps = {}) {
  return defineEntityAction({
    entity: 'users',
    action: 'create',
    schema: createInviteSchema,
    parse: parseUserForm,
    write: ({ data, db }) => createInvite(data, db),
    revalidate: revalidateUsers,
    notify: (user) => notifyInvite(user, deps),
    notifyErrorMessage: () => INVITE_EMAIL_WARNING,
    errorMessage: inviteErrorMessage,
  })
}

export const updateUserAction = defineEntityAction({
  entity: 'users',
  action: 'update',
  schema: updateUserSchema,
  parse: parseUserForm,
  write: ({ data, db, user }) => {
    if (data.id === user.id && !keepsOwnUserManagement(data.permissions)) {
      throw new AntiLockoutError()
    }

    return updateUserPermissions(data.id, { name: data.name, permissions: data.permissions }, db)
  },
  revalidate: revalidateUsers,
  errorMessage: antiLockoutErrorMessage,
})

export const disableUserAction = defineEntityAction({
  entity: 'users',
  action: 'update',
  schema: userIdSchema,
  write: ({ data, db, user }) => {
    if (data.id === user.id) throw new AntiLockoutError()
    return setUserStatus(data.id, 'disabled', db)
  },
  revalidate: revalidateUsers,
  errorMessage: antiLockoutErrorMessage,
})

export const reactivateUserAction = defineEntityAction({
  entity: 'users',
  action: 'update',
  schema: userIdSchema,
  write: ({ data, db }) => setUserStatus(data.id, 'active', db),
  revalidate: revalidateUsers,
})

export const cancelInviteAction = defineEntityAction({
  entity: 'users',
  action: 'delete',
  schema: userIdSchema,
  write: ({ data, db }) => deletePendingInvite(data.id, db),
  revalidate: revalidateUsers,
})

export function parseUserForm(formData: FormData): unknown {
  const permissions = formData
    .getAll('permissions')
    .filter((value): value is string => typeof value === 'string')
    .map((value) => {
      const [entity, action] = value.split(':')
      return { entity, action }
    })

  return {
    email: formData.get('email'),
    name: formData.get('name'),
    id: formData.get('id'),
    permissions,
  }
}

export function normalizePermissions(permissions: Permission[]): Permission[] {
  const keys = new Set(permissions.map(permissionFormValue))

  for (const permission of permissions) {
    if (permission.action !== 'read') {
      keys.add(permissionFormValue({ entity: permission.entity, action: 'read' }))
    }
  }

  return PERMISSION_CATALOG.filter((permission) => keys.has(permissionFormValue(permission)))
}

function keepsOwnUserManagement(permissions: Permission[]): boolean {
  return USER_MANAGEMENT_PERMISSIONS.every((required) =>
    permissions.some((permission) => permission.entity === required.entity && permission.action === required.action)
  )
}

function revalidateUsers() {
  revalidatePath('/admin/users')
}

async function notifyInvite(
  user: Awaited<ReturnType<typeof createInvite>>,
  deps: CreateInviteActionDeps
): Promise<string | undefined> {
  const panelUrl = deps.panelUrl ?? (await adminPanelUrl())
  if (!panelUrl) return INVITE_EMAIL_WARNING

  return sendInviteEmail({ to: user.email, name: user.name, panelUrl }, { env: deps.env, sendMail: deps.sendMail })
}

async function adminPanelUrl(): Promise<URL | null> {
  const origin = getPublicOriginFromHeaders(await headers())
  return origin ? new URL('/admin', origin) : null
}

function inviteErrorMessage(error: unknown): string | undefined {
  if (!(error instanceof UserEmailCollisionError)) return undefined

  if (error.status === 'active') return 'Esse e-mail já é um Usuário.'
  if (error.status === 'disabled') return 'Esse e-mail pertence a um Usuário desabilitado — use Reativar.'
  return 'Já existe um Convite pendente para esse e-mail — edite o Convite existente.'
}

function antiLockoutErrorMessage(error: unknown): string | undefined {
  return error instanceof AntiLockoutError
    ? 'Você não pode retirar de si a gestão de Usuários nem se desabilitar.'
    : undefined
}

class AntiLockoutError extends Error {
  constructor() {
    super('User cannot lock themselves out')
    this.name = 'AntiLockoutError'
  }
}
