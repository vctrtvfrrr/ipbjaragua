ALTER TYPE "public"."permission_entity" ADD VALUE 'featured_images';--> statement-breakpoint
CREATE TABLE "featured_images" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "featured_images_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"path" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "featured_images_path_unique" UNIQUE("path")
);
--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "featured_image_id" integer;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_featured_image_id_featured_images_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."featured_images"("id") ON DELETE set null ON UPDATE no action;