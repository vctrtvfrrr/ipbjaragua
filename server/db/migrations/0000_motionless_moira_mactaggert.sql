CREATE TABLE `agenda` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`weekday` integer,
	`time` text,
	`is_recurring` integer NOT NULL,
	`event_date` text
);
--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`url` text,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`author` text,
	`date` text NOT NULL,
	`index` integer NOT NULL,
	`year` integer NOT NULL,
	`content` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `liturgies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`theme` text
);
--> statement-breakpoint
CREATE TABLE `liturgy_acts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`liturgy_id` integer NOT NULL,
	`position` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`liturgy_id`) REFERENCES `liturgies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `liturgy_moments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`act_id` integer NOT NULL,
	`position` integer NOT NULL,
	`type` text NOT NULL,
	`song_id` integer,
	`scripture_passages` text,
	`description` text,
	`sermon_reference` text,
	`sermon_theme` text,
	`sacrament_type` text,
	FOREIGN KEY (`act_id`) REFERENCES `liturgy_acts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`song_id`) REFERENCES `songs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`full_name` text NOT NULL,
	`mother_name` text,
	`father_name` text,
	`birth_date` text,
	`marital_status` text,
	`wedding_date` text,
	`spouse_name` text,
	`phone` text,
	`email` text,
	`address_street` text,
	`address_number` text,
	`address_complement` text,
	`home_church` text,
	`birth_place` text,
	`nationality` text,
	`sex` text,
	`profession` text,
	`education` text,
	`baptism_year` integer,
	`baptism_place` text,
	`profession_of_faith_year` integer,
	`profession_of_faith_place` text,
	`member_since` text,
	`member_until` text,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `songs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`songwriter` text,
	`performer` text,
	`album` text,
	`track` integer,
	`lyrics` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `songs_slug_unique` ON `songs` (`slug`);