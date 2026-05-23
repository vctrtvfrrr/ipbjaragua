import { defineNitroPlugin } from 'nitropack/runtime';

// All SQLite-dependent imports are dynamic to prevent bun:sqlite from appearing
// in the static import chain during Nuxt's build analysis (which runs in Node.js).
export default defineNitroPlugin(async () => {
  const [{ migrate }, { db }, { _injectDb }] = await Promise.all([
    import('drizzle-orm/bun-sqlite/migrator'),
    import('../db/client'),
    import('../modules/bulletin/bulletin'),
  ]);
  migrate(db, { migrationsFolder: './server/db/migrations' });
  _injectDb(db);
});
