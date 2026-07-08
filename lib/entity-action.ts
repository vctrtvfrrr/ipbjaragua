import type { z } from 'zod'
import { db as defaultDb, type Database } from '@/db'
import { getCurrentUser, type CurrentUser } from '@/lib/auth/current-user'
import type { Action, Entity } from '@/lib/authz'

const SESSION_ERROR = 'Sua sessão expirou. Faça login novamente.'
const PERMISSION_ERROR = 'Você não tem permissão para executar esta ação.'
const GENERIC_ERROR = 'Não foi possível concluir a ação.'

export type ActionState =
  | { status: 'idle' }
  | { status: 'error'; fieldErrors?: Record<string, string[]>; formError?: string; values?: Record<string, string> }
  | { status: 'success'; warning?: string }

export type EntityActionContext = {
  user: CurrentUser | null
  db: Database
}

type ParsedData<Schema extends z.ZodType> = z.output<Schema>

type WriteContext<Schema extends z.ZodType> = {
  user: CurrentUser
  db: Database
  data: ParsedData<Schema>
}

type EntityActionOptions<Schema extends z.ZodType, WriteResult> = {
  entity: Entity
  action: Action
  schema: Schema
  parse?: (formData: FormData) => unknown
  write: (context: WriteContext<Schema>) => WriteResult | Promise<WriteResult>
  revalidate?: (result: Awaited<WriteResult>, context: WriteContext<Schema>) => void | Promise<void>
  notify?: (
    result: Awaited<WriteResult>,
    context: WriteContext<Schema>
  ) => string | undefined | Promise<string | undefined>
  notifyErrorMessage?: (error: unknown) => string | undefined
  validationErrorMessage?: (fieldErrors: Record<string, string[]>) => string | undefined
  errorMessage?: (error: unknown) => string | undefined
}

export function parseForm(formData: FormData): Record<string, string> {
  const parsed: Record<string, string> = {}

  for (const [name, value] of formData.entries()) {
    if (typeof value !== 'string') {
      throw new Error('FormData must contain only string fields')
    }

    if (Object.hasOwn(parsed, name)) {
      throw new Error('FormData must contain unique fields')
    }

    parsed[name] = value
  }

  return parsed
}

export function requirePermission(user: CurrentUser | null, entity: Entity, action: Action): ActionState | null {
  if (!user) return { status: 'error', formError: SESSION_ERROR }
  if (!user.can(entity, action)) return { status: 'error', formError: PERMISSION_ERROR }

  return null
}

export function defineEntityAction<Schema extends z.ZodType, WriteResult>(
  options: EntityActionOptions<Schema, WriteResult>
) {
  async function execute(context: EntityActionContext, formData: FormData): Promise<ActionState> {
    const permissionError = requirePermission(context.user, options.entity, options.action)
    if (permissionError) return permissionError

    const user = context.user
    if (!user) return { status: 'error', formError: SESSION_ERROR }

    try {
      const parsedForm = options.parse ? options.parse(formData) : parseForm(formData)
      const parsedData = options.schema.safeParse(parsedForm)

      if (!parsedData.success) {
        const fieldErrors = fieldErrorsFrom(parsedData.error.flatten().fieldErrors)
        const formError = options.validationErrorMessage?.(fieldErrors)
        // React 19 resets uncontrolled form fields after the action, so echo the
        // submitted values back for the form to restore them on validation failure.
        return options.parse
          ? { status: 'error', fieldErrors, formError }
          : { status: 'error', fieldErrors, formError, values: parsedForm as Record<string, string> }
      }

      const writeContext: WriteContext<Schema> = { user, db: context.db, data: parsedData.data }
      const result = await options.write(writeContext)
      await options.revalidate?.(result as Awaited<WriteResult>, writeContext)
      const warning = await notifyWarning(options, result as Awaited<WriteResult>, writeContext)

      return warning ? { status: 'success', warning } : { status: 'success' }
    } catch (error) {
      return { status: 'error', formError: options.errorMessage?.(error) ?? GENERIC_ERROR }
    }
  }

  async function action(prev: ActionState, formData: FormData): Promise<ActionState> {
    void prev

    return execute({ user: await getCurrentUser(), db: defaultDb }, formData)
  }

  return { action, execute }
}

async function notifyWarning<Schema extends z.ZodType, WriteResult>(
  options: EntityActionOptions<Schema, WriteResult>,
  result: Awaited<WriteResult>,
  context: WriteContext<Schema>
): Promise<string | undefined> {
  try {
    return await options.notify?.(result, context)
  } catch (error) {
    return options.notifyErrorMessage?.(error) ?? GENERIC_ERROR
  }
}

export function fieldErrorsFrom(fieldErrors: Record<string, string[] | undefined>): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(fieldErrors).filter((entry): entry is [string, string[]] => Boolean(entry[1]))
  )
}
