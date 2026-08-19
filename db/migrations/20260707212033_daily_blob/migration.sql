UPDATE "bulletins" SET "title" = 'Boletim Dominical' WHERE "title" IS NULL;--> statement-breakpoint
ALTER TABLE "bulletins" ALTER COLUMN "title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bulletins" DROP COLUMN "deleted_at";
