import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './db/schema/*.schema.ts',
  out: './db/migrations',
  dbCredentials: {
    url: './data/db.sqlite',
  },
})
