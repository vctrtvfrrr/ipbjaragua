CREATE TYPE "public"."meeting_minute_status" AS ENUM('pending', 'approved');--> statement-breakpoint
ALTER TYPE "public"."permission_entity" ADD VALUE 'meeting_minutes';--> statement-breakpoint
CREATE TABLE "meeting_minute_topics" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "meeting_minute_topics_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"meeting_minute_id" integer NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"discussion" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_minutes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "meeting_minutes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone NOT NULL,
	"location" text NOT NULL,
	"attendees" text NOT NULL,
	"opening" text NOT NULL,
	"closing" text NOT NULL,
	"status" "meeting_minute_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meeting_minutes_number_unique" UNIQUE("number"),
	CONSTRAINT "meeting_minutes_ended_after_started" CHECK ("meeting_minutes"."ended_at" > "meeting_minutes"."started_at")
);
--> statement-breakpoint
ALTER TABLE "meeting_minute_topics" ADD CONSTRAINT "meeting_minute_topics_meeting_minute_id_meeting_minutes_id_fk" FOREIGN KEY ("meeting_minute_id") REFERENCES "public"."meeting_minutes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meeting_minutes_started_at_index" ON "meeting_minutes" USING btree ("started_at");