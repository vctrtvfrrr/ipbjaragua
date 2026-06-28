import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const globalForDb = globalThis as unknown as { client?: ReturnType<typeof postgres> }

const client = globalForDb.client ?? postgres(DATABASE_URL)

if (process.env.NODE_ENV !== 'production') {
  globalForDb.client = client
}

export const db = drizzle(client, { schema })
