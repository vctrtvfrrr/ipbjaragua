import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from '@/db/schema'

export type TestDb = ReturnType<typeof createTestDb>

// An in-memory database with the real migrations applied, so query tests
// exercise the actual schema (soft-delete columns, constraints) end-to-end.
export function createTestDb() {
  const sqlite = new Database(':memory:')
  sqlite.pragma('foreign_keys = ON')
  const db = drizzle(sqlite, { schema })
  migrate(db, { migrationsFolder: './db/migrations' })
  return db
}
