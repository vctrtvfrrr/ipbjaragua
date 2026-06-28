import * as pg from 'drizzle-orm/pg-core'

export const id = () => pg.integer('id').primaryKey().generatedAlwaysAsIdentity()

export const timestamps = () => ({
  created_at: pg.timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  updated_at: pg.timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
})

export const deletedAt = () => ({ deleted_at: pg.timestamp('deleted_at', { withTimezone: true, mode: 'string' }) })
