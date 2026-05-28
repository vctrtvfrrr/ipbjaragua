PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_liturgies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`theme` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
INSERT INTO `__new_liturgies`("id", "date", "theme", "created_at", "updated_at", "deleted_at") SELECT "id", "date", "theme", "created_at", "updated_at", "deleted_at" FROM `liturgies`;--> statement-breakpoint
DROP TABLE `liturgies`;--> statement-breakpoint
ALTER TABLE `__new_liturgies` RENAME TO `liturgies`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_liturgy_moments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`act_id` integer NOT NULL,
	`position` integer NOT NULL,
	`type` text NOT NULL,
	`song_id` integer,
	`scripture_passages` text,
	`description` text,
	`sermon_speaker` text,
	`sermon_theme` text,
	`sacrament_type` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`act_id`) REFERENCES `liturgy_acts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`song_id`) REFERENCES `songs`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "sacrament_type_required" CHECK("__new_liturgy_moments"."type" <> 'sacrament' OR "__new_liturgy_moments"."sacrament_type" IS NOT NULL)
);
--> statement-breakpoint
INSERT INTO `__new_liturgy_moments`("id", "act_id", "position", "type", "song_id", "scripture_passages", "description", "sermon_speaker", "sermon_theme", "sacrament_type", "created_at", "updated_at") SELECT "id", "act_id", "position", "type", "song_id", "scripture_passages", "description", "sermon_speaker", "sermon_theme", "sacrament_type", "created_at", "updated_at" FROM `liturgy_moments`;--> statement-breakpoint
DROP TABLE `liturgy_moments`;--> statement-breakpoint
ALTER TABLE `__new_liturgy_moments` RENAME TO `liturgy_moments`;