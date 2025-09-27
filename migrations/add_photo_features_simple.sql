-- =================================
-- 🌸 Simple Photo Features Migration
-- Compatible with all MySQL versions
-- =================================

-- Create virtuous_photos table if it doesn't exist
CREATE TABLE IF NOT EXISTS virtuous_photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_path VARCHAR(500) NOT NULL,
    title VARCHAR(200),
    description TEXT,
    alt_text VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add new columns (will fail silently if they already exist)
ALTER TABLE virtuous_photos ADD COLUMN category VARCHAR(50) DEFAULT 'darshan';
ALTER TABLE virtuous_photos ADD COLUMN tags TEXT;
ALTER TABLE virtuous_photos ADD COLUMN view_count INT DEFAULT 0;
ALTER TABLE virtuous_photos ADD COLUMN upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE virtuous_photos ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE virtuous_photos ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- Create indexes (will fail silently if they already exist)
CREATE INDEX idx_virtuous_photos_category ON virtuous_photos(category);
CREATE INDEX idx_virtuous_photos_active ON virtuous_photos(is_active);
CREATE INDEX idx_virtuous_photos_upload_date ON virtuous_photos(upload_date);
CREATE INDEX idx_virtuous_photos_view_count ON virtuous_photos(view_count);

-- Update existing photos with default values
UPDATE virtuous_photos 
SET 
    category = 'darshan',
    tags = 'दर्शन, आध्यात्म, शांती',
    upload_date = NOW(),
    is_active = TRUE
WHERE category IS NULL OR category = '';

-- Create photo categories table
CREATE TABLE IF NOT EXISTS photo_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT IGNORE INTO photo_categories (id, name, description) VALUES
('darshan', 'दर्शन', 'सद्गुरूंचे पावन दर्शन'),
('satsang', 'सत्संग', 'सत्संग कार्यक्रम'),
('festivals', 'सण', 'धार्मिक सण आणि उत्सव'),
('ashram', 'आश्रम', 'आश्रमाचे दृश्य'),
('devotees', 'भक्तगण', 'भक्तगणांचे कार्यक्रम'),
('nature', 'निसर्ग', 'आध्यात्मिक निसर्ग दृश्य');

-- Create photo views tracking table
CREATE TABLE IF NOT EXISTS photo_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    photo_id INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for photo views
CREATE INDEX idx_photo_views_photo_id ON photo_views(photo_id);
CREATE INDEX idx_photo_views_viewed_at ON photo_views(viewed_at);

-- Add sample data for testing
INSERT IGNORE INTO virtuous_photos (image_path, title, description, alt_text, category, tags, is_active) VALUES
('/static/images/virtue1.jpg', 'सद्गुरूंचे पहिले दर्शन', 'सद्गुरूंचे पावन दर्शन - आध्यात्मिक प्रेरणा आणि शांतीचा अनुभव', 'सद्गुरूंचे दर्शन 1', 'darshan', 'दर्शन, आध्यात्म, शांती', TRUE),
('/static/images/virtue2.jpg', 'सद्गुरूंचे दुसरे दर्शन', 'सद्गुरूंचे पावन दर्शन - भक्ती आणि प्रेमाचा अनुभव', 'सद्गुरूंचे दर्शन 2', 'darshan', 'दर्शन, भक्ती, प्रेम', TRUE),
('/static/images/virtue3.jpg', 'सद्गुरूंचे तिसरे दर्शन', 'सद्गुरूंचे पावन दर्शन - ज्ञान आणि प्रकाशाचा अनुभव', 'सद्गुरूंचे दर्शन 3', 'darshan', 'दर्शन, ज्ञान, प्रकाश', TRUE),
('/static/images/virtue4.jpg', 'सद्गुरूंचे चौथे दर्शन', 'सद्गुरूंचे पावन दर्शन - करुणा आणि दया', 'सद्गुरूंचे दर्शन 4', 'darshan', 'दर्शन, करुणा, दया', TRUE),
('/static/images/virtue5.jpg', 'सद्गुरूंचे पाचवे दर्शन', 'सद्गुरूंचे पावन दर्शन - आनंद आणि उत्साह', 'सद्गुरूंचे दर्शन 5', 'darshan', 'दर्शन, आनंद, उत्साह', TRUE),
('/static/images/virtue6.jpg', 'सद्गुरूंचे सहावे दर्शन', 'सद्गुरूंचे पावन दर्शन - शक्ती आणि ऊर्जा', 'सद्गुरूंचे दर्शन 6', 'darshan', 'दर्शन, शक्ती, ऊर्जा', TRUE);

-- Show results
SELECT 'Migration completed successfully!' as status;
SELECT COUNT(*) as total_photos FROM virtuous_photos;
SELECT COUNT(*) as total_categories FROM photo_categories;