import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { deletedAt, id, timestamps } from "./common-fields";

export const agenda = sqliteTable("agenda", {
  id: id(),
  title: text("title").notNull(),
  description: text("description"),
  weekday: int("weekday"),
  time: text("time"),
  is_recurring: int("is_recurring", { mode: "boolean" }).notNull(),
  event_date: text("event_date"),
  ...timestamps(),
  ...deletedAt(),
});
