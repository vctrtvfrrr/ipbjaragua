import { PGlite } from '@electric-sql/pglite'
import { describe, expect, it } from 'vitest'
import { parseBibleReference, type BibleCitation } from '@/lib/bible-reference'
import { acervoPassages, type AcervoPassage } from '@/tests/acervo'
import { applyMigration, applyMigrationsBefore } from '@/tests/migrations'

type StoredPassage = AcervoPassage & { citation: BibleCitation | null }

const MIGRATION = 'scripture_citation_backfill'

async function seed(client: PGlite, passages: AcervoPassage[]) {
  await client.exec(`
    INSERT INTO liturgies (date, theme, time) VALUES ('2025-02-09', 'Culto Solene', '09:00');
    INSERT INTO liturgy_acts (liturgy_id, position, name)
      SELECT id, 1, 'Adoração' FROM liturgies;
  `)

  const moments: number[] = []
  for (const value of [JSON.stringify(passages), null, '[]']) {
    const { rows } = await client.query<{ id: number }>(
      `INSERT INTO liturgy_moments (act_id, position, type, scripture_passages)
       SELECT id, 1, 'bible_reading', $1 FROM liturgy_acts RETURNING id`,
      [value]
    )
    moments.push(rows[0].id)
  }
  return { acervo: moments[0], withoutPassages: moments[1], withEmptyPassages: moments[2] }
}

async function storedPassages(client: PGlite, momentId: number) {
  const { rows } = await client.query<{ scripture_passages: StoredPassage[] | null }>(
    'SELECT scripture_passages FROM liturgy_moments WHERE id = $1',
    [momentId]
  )
  return rows[0].scripture_passages
}

describe('scripture citation backfill migration', () => {
  it('interprets the Acervo Histórico without touching its text or its Versão', async () => {
    const client = new PGlite()
    const passages = await acervoPassages()
    await applyMigrationsBefore(client, MIGRATION)
    const moments = await seed(client, passages)

    await applyMigration(client, MIGRATION)
    const stored = await storedPassages(client, moments.acervo)

    expect(stored).toHaveLength(passages.length)
    stored?.forEach((passage, index) => {
      const parsed = parseBibleReference(passages[index].reference)
      expect(passage.text).toBe(passages[index].text)
      expect(passage.version).toBe(passages[index].version)
      expect(passage.reference).toBe('error' in parsed ? passages[index].reference : parsed.reference)
      expect(passage.citation).toEqual('error' in parsed ? null : parsed.citation)
    })
  })

  it('leaves the three references written without a book uninterpreted', async () => {
    const client = new PGlite()
    await applyMigrationsBefore(client, MIGRATION)
    const moments = await seed(client, await acervoPassages())

    await applyMigration(client, MIGRATION)
    const stored = (await storedPassages(client, moments.acervo)) ?? []

    expect(stored.filter((passage) => passage.citation === null).map((passage) => passage.reference)).toEqual([
      '2:1-5',
      '2:20-23',
      '3:1-6',
    ])
  })

  it('changes nothing when it runs again over rows it already converted', async () => {
    const client = new PGlite()
    await applyMigrationsBefore(client, MIGRATION)
    const moments = await seed(client, await acervoPassages())

    await applyMigration(client, MIGRATION)
    const converted = await storedPassages(client, moments.acervo)
    await applyMigration(client, MIGRATION)

    expect(await storedPassages(client, moments.acervo)).toEqual(converted)
    expect(await storedPassages(client, moments.withoutPassages)).toBeNull()
    expect(await storedPassages(client, moments.withEmptyPassages)).toEqual([])
  })
})
