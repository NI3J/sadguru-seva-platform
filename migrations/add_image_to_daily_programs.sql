-- Migration: Add image_path column to daily_programs table
-- Date: 2025-01-XX

ALTER TABLE `daily_programs` 
ADD COLUMN `image_path` VARCHAR(255) NULL DEFAULT NULL AFTER `content`;
