export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { migrate } = await import('drizzle-orm/postgres-js/migrator')
    const { db } = await import('@/db')
    await migrate(db, { migrationsFolder: './db/migrations' })
  }
}
