ALTER TABLE "bulletins" DROP COLUMN "agenda_from";--> statement-breakpoint
ALTER TABLE "bulletins" DROP COLUMN "agenda_to";--> statement-breakpoint
ALTER TABLE "bulletins" DROP COLUMN "birthdays_from";--> statement-breakpoint
ALTER TABLE "bulletins" DROP COLUMN "birthdays_to";--> statement-breakpoint
ALTER TABLE "bulletins" ADD CONSTRAINT "bulletins_edition_unique" UNIQUE("edition");