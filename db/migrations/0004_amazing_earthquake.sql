ALTER TABLE `bulletins` ADD `edition` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
UPDATE `bulletins` SET `edition` = 68 WHERE `date` = '2026-05-24';
--> statement-breakpoint
UPDATE `bulletins` SET `edition` = 69 WHERE `date` = '2026-05-31';
--> statement-breakpoint
UPDATE `bulletins` SET `edition` = 70 WHERE `date` = '2026-06-07';
