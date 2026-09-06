import { getCurrentUser } from '@/lib/auth/current-user'
import type { Action } from '@/lib/authz'
import { fetchBibleBook, isBibleVersion } from '@/lib/bible'
import { parseBibleReference, sliceBibleText } from '@/lib/bible-reference'
import { requirePermission } from '@/lib/entity-action'

const UNAVAILABLE = 'Não foi possível buscar o texto agora. Tente novamente.'

export type ScripturePassageResolution = { reference: string; text: string; verses: number } | { error: string }

export async function resolveScripturePassage(options: {
  action: Action
  reference: string
  version: string
}): Promise<ScripturePassageResolution> {
  const permission = requirePermission(await getCurrentUser(), 'liturgies', options.action)
  if (permission) {
    return { error: permission.status === 'error' ? (permission.formError ?? UNAVAILABLE) : UNAVAILABLE }
  }

  const parsed = parseBibleReference(options.reference)
  if ('error' in parsed) return { error: parsed.error }
  if (!isBibleVersion(options.version)) return { error: 'Escolha uma Versão para buscar o texto.' }

  try {
    const verses = sliceBibleText(parsed.citation, await fetchBibleBook(options.version, parsed.citation.book))
    if (verses.length === 0) return { error: 'Não encontramos esta referência na Versão escolhida.' }
    return { reference: parsed.reference, text: verses.join('\n'), verses: verses.length }
  } catch {
    return { error: UNAVAILABLE }
  }
}
