import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

const DB_PATH = './data/db.sqlite'

// Reuse one connection across dev hot reloads, which re-evaluate this module.
const globalForDb = globalThis as unknown as { sqlite?: Database.Database }

const sqlite = globalForDb.sqlite ?? new Database(DB_PATH)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

if (process.env.NODE_ENV !== 'production') {
  globalForDb.sqlite = sqlite
}

export const db = drizzle(sqlite, { schema })
