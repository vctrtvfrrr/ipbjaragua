import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';

const url = process.env.DATABASE_URL ?? './data/db.sqlite';
const sqlite = new Database(url, { create: true });
export const db = drizzle(sqlite, { schema });
