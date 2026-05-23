import { defineNitroPlugin } from 'nitropack/runtime';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from '../db/client';
import { _injectDb } from '../modules/bulletin/bulletin';

export default defineNitroPlugin(() => {
  migrate(db, { migrationsFolder: './server/db/migrations' });
  _injectDb(db);
});
