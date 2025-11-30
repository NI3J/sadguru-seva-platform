-- Migration: Add todays_count column to harijap_progress table
-- Date: 2024-12-19
-- Description: Add todays_count column to track today's total word count separately

-- Add todays_count column
ALTER TABLE harijap_progress 
ADD COLUMN todays_count INT DEFAULT 0 AFTER today_words;

-- Update existing records to initialize todays_count
UPDATE harijap_progress 
SET todays_count = today_words
WHERE todays_count = 0;

-- Add index for better performance on today's queries
CREATE INDEX idx_harijap_todays_count ON harijap_progress(todays_count);
CREATE INDEX idx_harijap_bhaktgan_todays_count ON harijap_progress(bhaktgan_id, todays_count);
