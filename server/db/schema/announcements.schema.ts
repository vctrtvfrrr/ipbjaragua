import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { deletedAt, id, timestamps } from "./common-fields";

export const announcements = sqliteTable("announcements", {
  id: id(),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url"),
  expires_at: text("expires_at").notNull(),
  ...timestamps(),
  ...deletedAt(),
});
