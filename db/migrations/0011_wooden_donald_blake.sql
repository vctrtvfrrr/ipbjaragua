CREATE TYPE "public"."liturgy_status" AS ENUM('draft', 'published');--> statement-breakpoint
ALTER TABLE "liturgies" ADD COLUMN "status" "liturgy_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
UPDATE "liturgies"
SET "status" = 'published'
WHERE "date" <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date;
