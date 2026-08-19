import type { PgAsyncDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { relations, type Relations } from './relations'

export type Database = PgAsyncDatabase<PgQueryResultHKT, Relations>

const globalForDb = globalThis as unknown as { client?: ReturnType<typeof postgres> }

let instance: PostgresJsDatabase<Relations> | undefined

function getDb(): PostgresJsDatabase<Relations> {
  if (instance) return instance

  const DATABASE_URL = process.env.DATABASE_URL

  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
  }

  const client = globalForDb.client ?? postgres(DATABASE_URL)

  if (process.env.NODE_ENV !== 'production') {
    globalForDb.client = client
  }

  instance = drizzle({ client, relations })
  return instance
}

export const db = new Proxy({} as PostgresJsDatabase<Relations>, {
  get(_target, prop) {
    const value = Reflect.get(getDb(), prop)
    return typeof value === 'function' ? value.bind(getDb()) : value
  },
})
