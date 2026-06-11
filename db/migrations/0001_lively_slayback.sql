PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`author` text,
	`date` text NOT NULL,
	`excerpt` text,
	`content` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
INSERT INTO `__new_articles`("id", "slug", "title", "author", "date", "excerpt", "content", "created_at", "updated_at", "deleted_at") SELECT "id", lower("title"), "title", "author", "date", NULL, "content", "created_at", "updated_at", "deleted_at" FROM `articles`;--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, 'ç', 'c');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, 'ã', 'a');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, 'á', 'a');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, 'à', 'a');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, 'â', 'a');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, 'é', 'e');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, 'ê', 'e');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, 'í', 'i');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, 'ó', 'o');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, 'ô', 'o');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, 'õ', 'o');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, 'ú', 'u');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, 'û', 'u');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, 'ü', 'u');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, 'ñ', 'n');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, 'ý', 'y');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, ' ', '-');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, '–', '-');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, '—', '-');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, '/', '-');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, '?', '');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, '!', '');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, '.', '');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, ',', '');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, '(', '');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, ')', '');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, ':', '');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, ';', '');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, '"', '');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, '''', '');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, '---', '-');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, '--', '-');--> statement-breakpoint
UPDATE `__new_articles` SET `slug` = replace(`slug`, '--', '-');--> statement-breakpoint
DROP TABLE `articles`;--> statement-breakpoint
ALTER TABLE `__new_articles` RENAME TO `articles`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `articles_slug_unique` ON `articles` (`slug`);
