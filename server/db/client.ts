import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

export type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

let sqlite: Database.Database | undefined;
let db: DbInstance | undefined;

export function useDb() {
  if (db) return db;
  const url = process.env.DATABASE_URL ?? './data/db.sqlite';
  sqlite = new Database(url);
  db = drizzle(sqlite, { schema });
  return db;
}
