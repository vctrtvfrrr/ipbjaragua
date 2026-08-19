import { createHash } from 'node:crypto'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { beforeEach, describe, expect, it } from 'vitest'
import { applyMigration, readMigrationSql } from '@/tests/migrations'

// The journal Drizzle 0.x kept in meta/_journal.json, in the order it applied the migrations.
// A database migrated by 0.x still carries these `created_at` values, and `agenda_always_dated`
// is the one whose value no longer matches its migration folder — the upgrade has to fall back
// to the hash to recognise that row.
const JOURNAL_0X: [name: string, when: number][] = [
  ['talented_ravenous', 1782610331348],
  ['fresh_squirrel_girl', 1783028814250],
  ['useful_supreme_intelligence', 1783039389580],
  ['article_author_as_user_ref', 1783203236520],
  ['grey_stark_industries', 1783252817232],
  ['opposite_martin_li', 1783457702756],
  ['agenda_always_dated', 1783537200000],
  ['daily_blob', 1783459233838],
  ['needy_ego', 1783475933141],
  ['stormy_speed_demon', 1783734486741],
  ['watery_maggott', 1783797602248],
  ['wooden_donald_blake', 1785004760244],
  ['lyrical_bullseye', 1785020599448],
  ['fearless_wraith', 1785084240199],
  ['drop_inert_featured_image_update', 1787091013288],
  ['meeting_minutes', 1787095816715],
]

async function seedDatabaseMigratedBy0x() {
  const client = new PGlite()

  await client.exec(`
    CREATE SCHEMA "drizzle";
    CREATE TABLE "drizzle"."__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    );
  `)

  for (const [name, when] of JOURNAL_0X) {
    await applyMigration(client, name)
    const hash = createHash('sha256').update(await readMigrationSql(name)).digest('hex')
    await client.query('INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at) VALUES ($1, $2)', [hash, when])
  }

  await client.exec(`INSERT INTO members (full_name, status) VALUES ('Ana', 'active')`)

  return client
}

async function migrationNames(client: PGlite) {
  const { rows } = await client.query<{ name: string | null }>(
    'SELECT name FROM "drizzle"."__drizzle_migrations" ORDER BY id'
  )
  return rows.map(({ name }) => name)
}

describe('booting over a database migrated by Drizzle 0.x', () => {
  let client: PGlite

  beforeEach(async () => {
    client = await seedDatabaseMigratedBy0x()
  })

  it('names every existing row without reapplying its DDL', async () => {
    await migrate(drizzle({ client }), { migrationsFolder: './db/migrations' })

    expect(await migrationNames(client)).toEqual(JOURNAL_0X.map(([name]) => expect.stringContaining(name)))
    expect((await client.query('SELECT full_name FROM members')).rows).toEqual([{ full_name: 'Ana' }])
  })

  it('is idempotent on a second boot', async () => {
    const db = drizzle({ client })
    await migrate(db, { migrationsFolder: './db/migrations' })
    await migrate(db, { migrationsFolder: './db/migrations' })

    expect(await migrationNames(client)).toHaveLength(JOURNAL_0X.length)
    expect((await client.query('SELECT full_name FROM members')).rows).toEqual([{ full_name: 'Ana' }])
  })
})
