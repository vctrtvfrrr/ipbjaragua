ALTER TABLE "announcements" ADD COLUMN "starts_at" date;--> statement-breakpoint
-- The creation date is the one the church lived, not the one the server session happens to
-- print, and LEAST guards the rows whose end is already past: their creation date alone would
-- open a window that closes before it opens.
UPDATE "announcements"
SET "starts_at" = LEAST(("created_at" AT TIME ZONE 'America/Sao_Paulo')::date, "expires_at");--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "starts_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_window_not_inverted" CHECK ("starts_at" <= "expires_at");
