ALTER TABLE "agenda" DROP COLUMN "weekday";--> statement-breakpoint
ALTER TABLE "agenda" DROP COLUMN "is_recurring";--> statement-breakpoint
ALTER TABLE "agenda" ALTER COLUMN "event_date" SET NOT NULL;
