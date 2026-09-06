import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// The Referências Bíblicas of the 340 Passagens the Acervo Histórico was imported with, in the
// order the import wrote them. They are the corpus the grammar was dimensioned against and the
// rows the backfill migration converts, so they are kept here rather than read back from the
// import staging area, which lives under the untracked `data/`.
export async function acervoReferences(): Promise<string[]> {
  return JSON.parse(await readFile(join(process.cwd(), 'tests/acervo-references.json'), 'utf8'))
}
