CREATE TABLE `reasoning_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`participant_id` text NOT NULL,
	`answers` text NOT NULL,
	`question_set` text NOT NULL,
	`submitted_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reasoning_responses_participant_id_unique` ON `reasoning_responses` (`participant_id`);