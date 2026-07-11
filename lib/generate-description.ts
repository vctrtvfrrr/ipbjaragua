import { generateDescription } from '@/lib/ai'
import { getCurrentUser } from '@/lib/auth/current-user'
import type { Action, Entity } from '@/lib/authz'
import { requirePermission } from '@/lib/entity-action'

type GenerateResult = { description: string; error?: undefined } | { error: string; description?: undefined }

export async function generatePublicationDescription(options: {
  entity: Entity
  action: Action
  input: string | null
  missingMessage: string
  failedMessage: string
}): Promise<GenerateResult> {
  const permission = requirePermission(await getCurrentUser(), options.entity, options.action)
  if (permission)
    return {
      error: permission.status === 'error' ? (permission.formError ?? options.failedMessage) : options.failedMessage,
    }
  if (!options.input?.trim()) return { error: options.missingMessage }
  try {
    return { description: await generateDescription(options.input) }
  } catch {
    return { error: options.failedMessage }
  }
}
