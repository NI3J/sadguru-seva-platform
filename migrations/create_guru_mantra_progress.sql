-- Migration: Create guru_mantra_progress table
-- Date: 2025-02-20
-- Description: Create table for Guru Mantra sadhana tracking

CREATE TABLE IF NOT EXISTS `guru_mantra_progress` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bhaktgan_id` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `count` int(11) DEFAULT 0 COMMENT 'Total count - NEVER resets',
  `total_malas` int(11) DEFAULT 0 COMMENT 'Total malas - NEVER resets',
  `current_mala_pronunciations` int(11) DEFAULT 0 COMMENT 'Current mala progress (0-108)',
  `total_pronunciations` int(11) DEFAULT 0 COMMENT 'Total pronunciations - NEVER resets',
  `today_pronunciations` int(11) DEFAULT 0 COMMENT 'Today\'s pronunciations - resets at IST midnight',
  `today_malas` int(11) DEFAULT 0 COMMENT 'Today\'s malas - resets at IST midnight',
  `today_date` date DEFAULT NULL COMMENT 'Current IST date for tracking',
  `todays_count` int(11) DEFAULT 0 COMMENT 'Today\'s count - resets at IST midnight',
  `last_spoken_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_bhaktgan` (`bhaktgan_id`),
  KEY `idx_bhaktgan_id` (`bhaktgan_id`),
  KEY `idx_today_date` (`today_date`),
  KEY `idx_bhaktgan_today` (`bhaktgan_id`, `today_date`),
  CONSTRAINT `fk_guru_mantra_bhaktgan` FOREIGN KEY (`bhaktgan_id`) REFERENCES `bhaktgan` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
