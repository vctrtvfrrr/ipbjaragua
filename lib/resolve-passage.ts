import { getCurrentUser } from '@/lib/auth/current-user'
import type { Action } from '@/lib/authz'
import { fetchBibleBook, isBibleVersion } from '@/lib/bible'
import { numberBibleVerses, parseBibleReference, sliceBibleVerses } from '@/lib/bible-reference'
import { requirePermission } from '@/lib/entity-action'

const UNAVAILABLE = 'Não foi possível buscar o texto agora. Tente novamente.'

export type ScripturePassageResolution =
  { reference: string; text: string; verses: number; missing: number } | { error: string }

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
    const verses = sliceBibleVerses(parsed.citation, await fetchBibleBook(options.version, parsed.citation.book))
    if (verses.length === 0) return { error: 'Não encontramos esta referência na Versão escolhida.' }

    // A shortfall is reported rather than refused: it means either a reference past the end of
    // the chapter or a verse the translation genuinely omits, and only the operator knows which.
    const asked = parsed.citation.ranges.reduce((total, range) => total + (range.verses?.length ?? 0), 0)
    return {
      reference: parsed.reference,
      text: numberBibleVerses(verses),
      verses: verses.length,
      missing: Math.max(0, asked - verses.length),
    }
  } catch {
    return { error: UNAVAILABLE }
  }
}
