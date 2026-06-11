CREATE TABLE `bulletins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text,
	`date` text NOT NULL,
	`article_id` integer,
	`liturgy_id` integer,
	`show_announcements` integer DEFAULT true NOT NULL,
	`show_agenda` integer DEFAULT true NOT NULL,
	`show_birthdays` integer DEFAULT true NOT NULL,
	`agenda_from` text NOT NULL,
	`agenda_to` text NOT NULL,
	`birthdays_from` text NOT NULL,
	`birthdays_to` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`liturgy_id`) REFERENCES `liturgies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bulletins_date_unique` ON `bulletins` (`date`);