CREATE TABLE `activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`activity_type` varchar(50) NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`image_urls` json,
	`keywords` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analysis_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`admin_id` int,
	`status` enum('pending','in_progress','completed','delivered') NOT NULL DEFAULT 'pending',
	`situation_analysis` text,
	`behavior_analysis` text,
	`unconscious_analysis` text,
	`job_recommendations` json,
	`action_plan` text,
	`report_url` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `analysis_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interview_answers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`question_id` int NOT NULL,
	`answer` text NOT NULL,
	`keywords` json,
	`sentiment` varchar(20),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `interview_answers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interview_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`question_number` int NOT NULL,
	`question` text NOT NULL,
	`category` varchar(100),
	`follow_up_questions` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interview_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`report_id` int NOT NULL,
	`job_title` varchar(200) NOT NULL,
	`company` varchar(200),
	`reason` text,
	`required_skills` json,
	`career_path` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `job_recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`type` varchar(50) NOT NULL,
	`title` varchar(200) NOT NULL,
	`content` text,
	`related_id` int,
	`is_read` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`report_id` int,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'KRW',
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`payment_method` varchar(50),
	`transaction_id` varchar(200),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`grade` varchar(50),
	`major` varchar(100),
	`family_status` text,
	`social_pressure` text,
	`additional_info` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profiles_id` PRIMARY KEY(`id`)
);
