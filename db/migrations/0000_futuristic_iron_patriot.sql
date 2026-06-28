CREATE TYPE "public"."moment_type" AS ENUM('bible_reading', 'song', 'prayer', 'sermon', 'sacrament', 'pastoral_act', 'other');--> statement-breakpoint
CREATE TYPE "public"."sacrament_type" AS ENUM('baptism', 'eucharist');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('active', 'transferred', 'deceased', 'removed');--> statement-breakpoint
CREATE TABLE "agenda" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "agenda_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"description" text,
	"weekday" integer,
	"time" time,
	"is_recurring" boolean NOT NULL,
	"event_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "announcements_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"description" text,
	"url" text,
	"expires_at" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "articles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"author" text,
	"date" date NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "bulletins" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bulletins_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" text,
	"date" date NOT NULL,
	"edition" integer NOT NULL,
	"article_id" integer,
	"show_announcements" boolean DEFAULT true NOT NULL,
	"show_agenda" boolean DEFAULT true NOT NULL,
	"show_birthdays" boolean DEFAULT true NOT NULL,
	"agenda_from" date NOT NULL,
	"agenda_to" date NOT NULL,
	"birthdays_from" date NOT NULL,
	"birthdays_to" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "bulletins_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "liturgies" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "liturgies_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"date" date NOT NULL,
	"theme" text NOT NULL,
	"time" time,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "liturgy_acts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "liturgy_acts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"liturgy_id" integer NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "liturgy_moments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "liturgy_moments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"act_id" integer NOT NULL,
	"position" integer NOT NULL,
	"type" "moment_type" NOT NULL,
	"song_id" integer,
	"scripture_passages" text,
	"description" text,
	"sermon_speaker" text,
	"sacrament_type" "sacrament_type",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sacrament_type_required" CHECK ("liturgy_moments"."type" <> 'sacrament' OR "liturgy_moments"."sacrament_type" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "members_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"full_name" text NOT NULL,
	"sex" text,
	"mother" text,
	"father" text,
	"birth_date" date,
	"birth_place" text,
	"marital_status" text,
	"wedding_date" date,
	"spouse" text,
	"phone" text,
	"email" text,
	"address_street" text,
	"address_number" text,
	"address_complement" text,
	"nationality" text,
	"education" text,
	"profession" text,
	"home_church" text,
	"baptism_year" integer,
	"baptism_place" text,
	"prof_faith_year" integer,
	"prof_faith_place" text,
	"member_since" date,
	"member_until" date,
	"status" "member_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "songs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "songs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"songwriter" text,
	"performer" text,
	"album" text,
	"track" integer,
	"lyrics" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "songs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "bulletins" ADD CONSTRAINT "bulletins_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liturgy_acts" ADD CONSTRAINT "liturgy_acts_liturgy_id_liturgies_id_fk" FOREIGN KEY ("liturgy_id") REFERENCES "public"."liturgies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liturgy_moments" ADD CONSTRAINT "liturgy_moments_act_id_liturgy_acts_id_fk" FOREIGN KEY ("act_id") REFERENCES "public"."liturgy_acts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liturgy_moments" ADD CONSTRAINT "liturgy_moments_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE no action ON UPDATE no action;