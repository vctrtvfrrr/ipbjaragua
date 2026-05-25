import { sql } from "drizzle-orm";
import * as sqlite from "drizzle-orm/sqlite-core";

export const id = () => sqlite.integer("id", { mode: "number" }).primaryKey({ autoIncrement: true });

export const timestamps = () => ({
  created_at: sqlite.text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: sqlite.text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const deletedAt = () => ({ deleted_at: sqlite.text("deleted_at") });
