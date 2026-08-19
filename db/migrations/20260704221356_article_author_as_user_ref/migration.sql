ALTER TABLE "articles" ADD COLUMN "author_id" integer;--> statement-breakpoint
UPDATE "articles" SET "author_id" = "users"."id" FROM "users" WHERE "users"."name" = "articles"."author";--> statement-breakpoint
ALTER TABLE "articles" ALTER COLUMN "author_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "author";
