ALTER TABLE "liturgies" ALTER COLUMN "time" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "liturgies" ADD CONSTRAINT "liturgies_date_theme_time_unique" UNIQUE("date","theme","time");