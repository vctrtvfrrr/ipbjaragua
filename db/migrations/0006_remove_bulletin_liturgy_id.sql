PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `bulletins_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text,
	`date` text NOT NULL,
	`edition` integer NOT NULL,
	`article_id` integer,
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
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `bulletins_new` SELECT `id`,`title`,`date`,`edition`,`article_id`,`show_announcements`,`show_agenda`,`show_birthdays`,`agenda_from`,`agenda_to`,`birthdays_from`,`birthdays_to`,`created_at`,`updated_at`,`deleted_at` FROM `bulletins`;
--> statement-breakpoint
DROP TABLE `bulletins`;
--> statement-breakpoint
ALTER TABLE `bulletins_new` RENAME TO `bulletins`;
--> statement-breakpoint
CREATE UNIQUE INDEX `bulletins_date_unique` ON `bulletins` (`date`);
--> statement-breakpoint
PRAGMA foreign_keys=ON;
