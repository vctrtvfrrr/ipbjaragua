import { createHash } from 'node:crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { applyMigration, readMigrationSql } from '@/tests/migrations'

// Real PostgreSQL, real driver: this is the path `instrumentation.ts` takes on the
// production boot, and adopting the 0.x migrations table is a one-shot, destructive
// step that happens before the server accepts traffic.
const ADMIN_DATABASE_URL = process.env.PG_TEST_DATABASE_URL ?? 'postgres://ipbjaragua:ipbjaragua@db:5432/postgres'
const DATABASE_NAME = 'ipbjaragua_migrations_upgrade'

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

function scratchDatabaseUrl() {
  const url = new URL(ADMIN_DATABASE_URL)
  url.pathname = `/${DATABASE_NAME}`
  return url.toString()
}

async function recreateScratchDatabase() {
  const admin = postgres(ADMIN_DATABASE_URL, { max: 1 })
  try {
    await admin.unsafe(`DROP DATABASE IF EXISTS "${DATABASE_NAME}"`)
    await admin.unsafe(`CREATE DATABASE "${DATABASE_NAME}"`)
  } finally {
    await admin.end()
  }
}

async function dropScratchDatabase() {
  const admin = postgres(ADMIN_DATABASE_URL, { max: 1 })
  try {
    await admin.unsafe(`DROP DATABASE IF EXISTS "${DATABASE_NAME}"`)
  } finally {
    await admin.end()
  }
}

async function seedDatabaseMigratedBy0x() {
  await recreateScratchDatabase()

  const client = postgres(scratchDatabaseUrl(), { max: 1 })
  await client.unsafe(`
    CREATE SCHEMA "drizzle";
    CREATE TABLE "drizzle"."__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    );
  `)

  const runner = { exec: (statement: string) => client.unsafe(statement) }
  for (const [name, when] of JOURNAL_0X) {
    await applyMigration(runner, name)
    const hash = createHash('sha256')
      .update(await readMigrationSql(name))
      .digest('hex')
    await client`INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at) VALUES (${hash}, ${when})`
  }

  await client`INSERT INTO members (full_name, status) VALUES ('Ana', 'active')`

  return client
}

describe('booting over a PostgreSQL database migrated by Drizzle 0.x', () => {
  let client: postgres.Sql

  beforeEach(async () => {
    client = await seedDatabaseMigratedBy0x()
  })

  afterEach(async () => {
    await client.end()
    await dropScratchDatabase()
  })

  it('names every existing row in place without reapplying its DDL', async () => {
    await migrate(drizzle({ client }), { migrationsFolder: './db/migrations' })

    const rows = await client<{ id: number; name: string | null }[]>`
      SELECT id, name FROM "drizzle"."__drizzle_migrations" ORDER BY id
    `
    expect(rows).toEqual(JOURNAL_0X.map(([name], index) => ({ id: index + 1, name: expect.stringContaining(name) })))
    expect(await client`SELECT full_name FROM members`).toEqual([{ full_name: 'Ana' }])
  })

  it('is idempotent on a second boot', async () => {
    const db = drizzle({ client })
    await migrate(db, { migrationsFolder: './db/migrations' })
    await migrate(db, { migrationsFolder: './db/migrations' })

    expect(await client`SELECT id FROM "drizzle"."__drizzle_migrations" ORDER BY id`).toHaveLength(JOURNAL_0X.length)
    expect(await client`SELECT full_name FROM members`).toEqual([{ full_name: 'Ana' }])
  })
})
