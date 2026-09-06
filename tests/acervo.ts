import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

export type AcervoPassage = { reference: string; text: string; version: string }

const editionsDirectory = join(process.cwd(), 'data/bulletin-import/editions')

// The Acervo Histórico as it was imported into production: the reference corpus the Bible
// reference grammar was dimensioned against, and the rows the backfill migration converts.
export async function acervoPassages(): Promise<AcervoPassage[]> {
  const files = await readdir(editionsDirectory)
  const passages: AcervoPassage[] = []

  for (const file of files.sort()) {
    collect(JSON.parse(await readFile(join(editionsDirectory, file), 'utf8')), passages)
  }

  return passages
}

function collect(node: unknown, passages: AcervoPassage[]): void {
  if (Array.isArray(node)) return node.forEach((child) => collect(child, passages))
  if (!node || typeof node !== 'object') return

  const record = node as Record<string, unknown>
  if (Array.isArray(record.scripture_passages)) passages.push(...(record.scripture_passages as AcervoPassage[]))
  Object.values(record).forEach((child) => collect(child, passages))
}
