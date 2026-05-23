import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const url = process.env.DATABASE_URL ?? './data/db.sqlite';
const sqlite = new Database(url);
export const db = drizzle(sqlite, { schema });
