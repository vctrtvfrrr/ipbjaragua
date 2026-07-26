ALTER TABLE "announcements" DROP CONSTRAINT "announcements_featured_image_id_featured_images_id_fk";
--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "flyer_path" text;--> statement-breakpoint
ALTER TABLE "announcements" DROP COLUMN "featured_image_id";