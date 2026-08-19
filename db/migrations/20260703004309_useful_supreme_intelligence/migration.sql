CREATE TYPE "public"."permission_action" AS ENUM('read', 'create', 'update', 'delete');--> statement-breakpoint
CREATE TYPE "public"."permission_entity" AS ENUM('bulletins', 'articles', 'liturgies', 'announcements', 'songs', 'members', 'agenda', 'users');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('pending', 'active', 'disabled');--> statement-breakpoint
CREATE TABLE "user_permissions" (
	"user_id" integer NOT NULL,
	"entity" "permission_entity" NOT NULL,
	"action" "permission_action" NOT NULL,
	CONSTRAINT "user_permissions_user_entity_action_unique" UNIQUE("user_id","entity","action")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"email" text NOT NULL,
	"name" text,
	"status" "user_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;