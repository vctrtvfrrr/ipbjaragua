CREATE TYPE "meeting_minute_book" AS ENUM('mesa-administrativa', 'assembleia-geral', 'secretaria-de-musica');--> statement-breakpoint
ALTER TABLE "meeting_minutes" ADD COLUMN "book" "meeting_minute_book";--> statement-breakpoint
-- Every Ata that exists today was the Mesa Administrativa's, back when it was the only Livro:
-- the backfill is the definition, not a guess.
UPDATE "meeting_minutes" SET "book" = 'mesa-administrativa';--> statement-breakpoint
ALTER TABLE "meeting_minutes" ALTER COLUMN "book" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "meeting_minutes" DROP CONSTRAINT "meeting_minutes_number_unique";--> statement-breakpoint
ALTER TABLE "meeting_minutes" ADD CONSTRAINT "meeting_minutes_book_number_unique" UNIQUE("book","number");--> statement-breakpoint
ALTER TABLE "user_permissions" ADD COLUMN "scope" text DEFAULT '' NOT NULL;--> statement-breakpoint
-- Every existing Ata grant meant the Mesa Administrativa's Livro, the only one there was: the
-- backfill keeps every Usuário exactly as authorized as before, neither losing nor gaining access.
UPDATE "user_permissions" SET "scope" = 'mesa-administrativa' WHERE "entity" = 'meeting_minutes';--> statement-breakpoint
ALTER TABLE "user_permissions" DROP CONSTRAINT "user_permissions_user_entity_action_unique";--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_entity_action_scope_unique" UNIQUE("user_id","entity","action","scope");--> statement-breakpoint
-- The row is canonical and the file is derived: clearing the cache costs the first export of
-- each Livro a full regeneration, and buys every stored Ata the new, Livro-carrying header.
UPDATE "meeting_minutes" SET "pdf_path" = NULL;
