import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { sql } from 'drizzle-orm'

export type TestDb = Awaited<ReturnType<typeof createTestDb>>

let base: Promise<{ db: ReturnType<typeof drizzle>; truncate: string }> | undefined

async function getBase() {
  if (base) return base
  base = (async () => {
    const client = new PGlite()
    const db = drizzle({ client })
    await migrate(db, { migrationsFolder: './db/migrations' })
    const { rows } = await client.query<{ tablename: string }>(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
    )
    const truncate = `TRUNCATE TABLE ${rows.map((r) => `"${r.tablename}"`).join(', ')} RESTART IDENTITY CASCADE`
    return { db, truncate }
  })()
  return base
}

export async function createTestDb() {
  const { db, truncate } = await getBase()
  await db.execute(sql.raw(truncate))
  return db
}
