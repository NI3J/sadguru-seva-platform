-- Migration: Add today's tracking fields to harijap_progress table
-- Date: 2024-10-25
-- Description: Add separate tracking for today's jap vs total jap

-- Add new columns for today's tracking
ALTER TABLE harijap_progress 
ADD COLUMN today_words INT DEFAULT 0 AFTER total_pronunciations,
ADD COLUMN today_pronunciations INT DEFAULT 0 AFTER today_words,
ADD COLUMN today_malas INT DEFAULT 0 AFTER today_pronunciations,
ADD COLUMN today_date DATE AFTER today_malas;

-- Update existing records to initialize today's data
UPDATE harijap_progress 
SET today_words = count,
    today_pronunciations = total_pronunciations,
    today_malas = total_malas,
    today_date = CURDATE()
WHERE today_date IS NULL;

-- Add index for better performance on today's queries
CREATE INDEX idx_harijap_today_date ON harijap_progress(today_date);
CREATE INDEX idx_harijap_bhaktgan_today ON harijap_progress(bhaktgan_id, today_date);
